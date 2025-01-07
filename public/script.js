document.addEventListener("DOMContentLoaded", () => {
  document.getElementById("currYear").textContent = new Date().getFullYear();
  document.getElementById("formGenQR").addEventListener("submit", async (e) => {
    e.preventDefault();

    const url = document.getElementById("inputUrl").value;

    console.log(url);

    try {
      const response = await fetch("/api/generateqr", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ url }),
      });

      if (!response.ok) {
        console.error("Response not OK:", response.status);
        throw new Error("Failed to fetch");
      }

      const data = await response.json();

      let containerQR = document.createElement("div");
      containerQR.className = "containerQR center_items";

      let qrCodeParentContainer = document.getElementById("qrCode");

      containerQR.innerHTML = `
        <div class="center_items_col">
          <img src="${data.qrCodeUrl}" class="border_solid" alt="QR Code"><br>
          <button class="download-button" id="downloadButton">
              <i class="fa fa-arrow-down"></i>
              Download .png
          </button>
          <div class="msgs" id="download_msg"></div>
          <a href="${data.qrCodeRedirectUrl}" target="_blank">
        <button class="test-button">
          Test QR Code URL
        </button>
      </a>
        </div>
        <div class="center_items id_info">
          <p style="font-size: 12px; padding-bottom: 8px">The ID of your QR Code is</p>
          <p><strong>${data.id_private}</strong></p><br>
          <button class="copy-button" id="copyButton">
              <i class="fas fa-link"></i>
              Copy ID
          </button>
          <div class="msgs copy-msg" id="copied_msg"></div>
          <br>
          <p class="text_det">We recommend saving this ID so you can track<br>the process of QR Code views whenever you wish.</p>
        </div>
      `;
      qrCodeParentContainer.appendChild(containerQR);

      document
        .getElementById("copyButton")
        .addEventListener("click", function () {
          const textToCopy = data.id_private;
          navigator.clipboard.writeText(textToCopy);

          const existingMsg = document.querySelector("#copied_msg .text_det");
          if (!existingMsg) {
            let copied_msg = document.createElement("div");
            copied_msg.className = "text_det";
            copied_msg.innerHTML = "Copied!";
            document.getElementById("copied_msg").appendChild(copied_msg);
          }
        });

      document
        .getElementById("downloadButton")
        .addEventListener("click", function () {
          const imageUrl = data.qrCodeUrl;
          const link = document.createElement("a");
          link.href = imageUrl;
          link.download = "qr_code.jpg";
          link.click();

          const existingMsg = document.querySelector("#download_msg .text_det");
          if (!existingMsg) {
            let download_msg = document.createElement("div");
            download_msg.className = "text_det";
            download_msg.innerHTML = "Your download will start soon...";
            document.getElementById("download_msg").appendChild(download_msg);
          }
        });
    } catch (error) {
      console.error("Error during fetch:", error);
    }
  });

  document
    .getElementById("formViewScans")
    .addEventListener("submit", async (e) => {
      e.preventDefault();

      const id = document.getElementById("inputID").value;

      console.log(id);

      const response = await fetch(`/api/stats?id=${id}`);

      if (!response.ok) {
        console.error("Response not OK:", response.status);
        throw new Error("Failed to fetch");
      }

      const data = await response.json();

      removeItems("dataYearTitle");
      removeItems("dataEntry");
      removeItems("text_det");

      const container = document.getElementById("statsResult");

      try {
        if (data.id === "0") {
          console.log("===============TWRA EDW===================");
          const div_error = document.createElement("div");
          div_error.className = "dateCreatedInfo";
          div_error.innerHTML = `
            <p class="text_det font_32">☹</p><br>
            <p class="text_det">Unfortunately, there is no QR Code associated with this ID. Please try again.</p>
          `;
          container.appendChild(div_error);
        } else {
          let arrayAllScans = decodeScans(data.scans);

          let currYear = "2000";

          arrayAllScans = arrayAllScans.reverse();

          for (let i = 0; i < arrayAllScans.length; i++) {
            const div = document.createElement("div");
            if (currYear !== arrayAllScans[i][0]) {
              div.className = "dataYearTitle";
              div.innerHTML = `<strong>${arrayAllScans[i][0]}</strong>`;
              currYear = arrayAllScans[i][0];
            }
            container.appendChild(div);

            const div_kid = document.createElement("div");
            div_kid.className = "dataEntry";
            div_kid.innerHTML = `
              <p>${arrayAllScans[i][1]}</p>
              <p><strong>${arrayAllScans[i][2]}</strong> views</p>
            `;
            container.appendChild(div_kid);
          }
          const div_date_info = document.createElement("div");
          div_date_info.className = "dateCreatedInfo";
          div_date_info.innerHTML = `
              <p class="text_det">QR Code was created at: ${getDate(
                data.created_at
              )}</p>
            `;
          container.appendChild(div_date_info);
        }
      } catch (error) {
        console.error("Error during fetch:", error);
      }
    });

  const tabs = document.querySelectorAll(".tab");
  let contents = document.querySelectorAll(".content");
  tabs.forEach((tab) => {
    tab.addEventListener("click", () => {
      tabs.forEach((t) => t.classList.remove("active"));
      tab.classList.add("active");

      const tr = tab.getAttribute("data-target");
      contents.forEach((content) => {
        if (content.id === tr) {
          content.classList.add("active");
        } else {
          content.classList.remove("active");
        }
      });
    });
  });

  function removeItems(classname) {
    document.querySelectorAll(`.${classname}`).forEach((element) => {
      element.remove();
    });
  }

  function decodeScans(scans) {
    const months = [
      "January",
      "February",
      "March",
      "April",
      "May",
      "June",
      "July",
      "August",
      "September",
      "October",
      "November",
      "December",
    ];
    scans = scans.slice(0, -1); //remove last ","
    const scanEntries = scans.split(",");
    // [ "2024.1:3", "2024.2:8" ]
    const r = scanEntries.length;
    const c = 3;

    const allScans = Array.from({ length: r }, () => Array(c).fill(0));

    for (let i = 0; i < r; i++) {
      const arrayInfo = scanEntries[i].split(":");
      const arrayDateInfo = arrayInfo[0].split(".");
      allScans[i][0] = arrayDateInfo[0];
      allScans[i][1] = months[parseInt(arrayDateInfo[1])];
      allScans[i][2] = arrayInfo[1];
      console.log;
    }
    return allScans;
  }

  function getDate(timestamp) {
    let arr = timestamp.split("T");
    return arr[0];
  }
});
