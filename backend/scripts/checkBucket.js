require('../src/config/loadEnv');
const { createClient } = require('@supabase/supabase-js');

const supabaseUrl = process.env.SUPABASE_URL || process.env.VITE_SUPABASE_URL;
const supabaseKey = process.env.SUPABASE_KEY || process.env.VITE_SUPABASE_KEY;

if (!supabaseUrl || !supabaseKey) {
  console.error('Missing Supabase credentials');
  process.exit(1);
}

const supabase = createClient(supabaseUrl, supabaseKey);

async function checkBucket() {
  console.log('Checking for "attachments" bucket...');
  const { data: buckets, error } = await supabase.storage.listBuckets();

  if (error) {
    console.error('Error listing buckets:', error);
    return;
  }

  const bucket = buckets.find(b => b.name === 'Attachments');
  if (bucket) {
    console.log('Bucket "Attachments" exists.');
    console.log('Public:', bucket.public);
  } else {
    console.log('Bucket "Attachments" DOES NOT exist.');
    console.log('Attempting to create it...');

    const { data, error: createError } = await supabase.storage.createBucket('Attachments', {
      public: true
    });

    if (createError) {
      console.error('Error creating bucket:', createError);
    } else {
      console.log('Bucket "attachments" created successfully.');
    }
  }
  const avatarBucketName = 'Avatars';
  const avatarBucket = buckets.find(b => b.name === avatarBucketName);
  if (avatarBucket) {
    console.log(`Bucket "${avatarBucketName}" exists.`);
    console.log('Public:', avatarBucket.public);
  } else {
    console.log(`Bucket "${avatarBucketName}" DOES NOT exist.`);
    console.log('Attempting to create it...');

    const { data, error: createError } = await supabase.storage.createBucket(avatarBucketName, {
      public: true
    });

    if (createError) {
      console.error(`Error creating bucket "${avatarBucketName}":`, createError);
    } else {
      console.log(`Bucket "${avatarBucketName}" created successfully.`);
    }
  }
}

checkBucket();
