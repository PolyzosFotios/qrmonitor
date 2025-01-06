import { createClient } from '@supabase/supabase-js';
import dotenv from 'dotenv';

dotenv.config();

const sburl = process.env.SB_URL;
const sbk = process.env.API_KEY;
export const supabase = createClient(sburl, sbk);