import { createClient } from '@supabase/supabase-js';
import dotenv from 'dotenv';
import { getDefaultStaticPageBody } from '../lib/static-pages';

dotenv.config({ path: '.env.local' });

const supabase = createClient(
  process.env.NEXT_PUBLIC_SUPABASE_URL!,
  process.env.SUPABASE_SERVICE_ROLE_KEY!
);

async function run() {
  console.log('Fetching global settings...');
  const { data, error } = await supabase.from('settings').select('data').eq('id', 'global').single();
  if (error) {
    console.error('Error fetching settings:', error);
    return;
  }

  const settings = data.data;
  
  if (!settings.staticPages) {
    console.log('No staticPages found in settings, nothing to update.');
    return;
  }

  const pageKeys = ['about', 'contact', 'privacy', 'terms', 'dmca', 'disclaimer', 'cookies'] as const;
  let updated = false;

  for (const key of pageKeys) {
    if (settings.staticPages[key]?.body) {
      // Overwrite the saved body with the new detailed default body
      const newBody = getDefaultStaticPageBody(key, settings);
      settings.staticPages[key].body = newBody;
      console.log(`Updated ${key} to new default body.`);
      updated = true;
    }
  }

  if (updated) {
    console.log('Saving updated settings back to database...');
    const { error: updateError } = await supabase.from('settings').update({ data: settings }).eq('id', 'global');
    if (updateError) {
      console.error('Error saving settings:', updateError);
    } else {
      console.log('Successfully updated static pages in the database!');
    }
  } else {
    console.log('No updates needed.');
  }
}

run();
