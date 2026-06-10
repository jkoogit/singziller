export async function up(pgm) {
  pgm.createTable("source_providers", {
    id: "id",
    code: { type: "text", notNull: true, unique: true },
    name: { type: "text", notNull: true },
    provider_type: { type: "text", notNull: true },
    base_url: { type: "text" },
    trust_level: { type: "integer", notNull: true, default: 50 },
    enabled: { type: "boolean", notNull: true, default: true },
    created_at: { type: "timestamptz", notNull: true, default: pgm.func("now()") },
    updated_at: { type: "timestamptz", notNull: true, default: pgm.func("now()") },
  });

  pgm.createTable("collection_runs", {
    id: "id",
    provider_id: {
      type: "integer",
      notNull: true,
      references: "source_providers(id)",
      onDelete: "restrict",
    },
    status: { type: "text", notNull: true },
    started_at: { type: "timestamptz", notNull: true, default: pgm.func("now()") },
    finished_at: { type: "timestamptz" },
    fetched_count: { type: "integer", notNull: true, default: 0 },
    error_message: { type: "text" },
  });

  pgm.createTable("source_records", {
    id: "id",
    provider_id: {
      type: "integer",
      notNull: true,
      references: "source_providers(id)",
      onDelete: "restrict",
    },
    collection_run_id: {
      type: "integer",
      references: "collection_runs(id)",
      onDelete: "set null",
    },
    external_id: { type: "text" },
    source_url: { type: "text" },
    raw_payload: { type: "jsonb", notNull: true },
    raw_hash: { type: "text", notNull: true },
    fetched_at: { type: "timestamptz", notNull: true, default: pgm.func("now()") },
  });

  pgm.addConstraint("source_records", "source_records_provider_hash_unique", {
    unique: ["provider_id", "raw_hash"],
  });
  pgm.createIndex("source_records", ["provider_id", "external_id"], {
    name: "idx_source_records_provider_external",
  });
}

export async function down(pgm) {
  pgm.dropTable("source_records");
  pgm.dropTable("collection_runs");
  pgm.dropTable("source_providers");
}
