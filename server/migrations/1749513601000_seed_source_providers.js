const providers = [
  ["tj-official", "TJ 공식", "official", "https://www.tjmedia.com/", 80],
  ["ky-official", "금영 공식", "official", "https://kysing.kr/", 80],
  ["youtube", "YouTube", "external-api", "https://www.googleapis.com/youtube/v3", 60],
  ["personal-api", "개인 API", "personal-api", null, 50],
  ["google-sheet", "Google Sheet", "manual-sheet", null, 70],
];

export async function up(pgm) {
  for (const [code, name, providerType, baseUrl, trustLevel] of providers) {
    pgm.sql(`
      insert into source_providers (code, name, provider_type, base_url, trust_level)
      values ('${code}', '${name}', '${providerType}', ${baseUrl ? `'${baseUrl}'` : "null"}, ${trustLevel})
      on conflict (code) do nothing
    `);
  }
}

export async function down(pgm) {
  pgm.sql(`
    delete from source_providers
    where code in ('tj-official', 'ky-official', 'youtube', 'personal-api', 'google-sheet')
  `);
}
