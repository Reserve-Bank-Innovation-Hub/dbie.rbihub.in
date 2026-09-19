-- DBIE database layout. Eight data schemas mirror DBIE's Statistics headings; meta holds the catalogue of every
-- DBIE menu entry and SDMX dataset, the code lists, per-table provenance and load history.
-- Idempotent; apply with:  psql -v ON_ERROR_STOP=1 -f scripts/db/schema.sql

CREATE SCHEMA IF NOT EXISTS real_sector;
CREATE SCHEMA IF NOT EXISTS financial_sector;
CREATE SCHEMA IF NOT EXISTS financial_markets;
CREATE SCHEMA IF NOT EXISTS external_sector;
CREATE SCHEMA IF NOT EXISTS public_finance;
CREATE SCHEMA IF NOT EXISTS corporate_sector;
CREATE SCHEMA IF NOT EXISTS socio_economic;
CREATE SCHEMA IF NOT EXISTS surveys;
CREATE SCHEMA IF NOT EXISTS meta;

COMMENT ON SCHEMA real_sector       IS 'DBIE Real Sector: agriculture, national income, industrial statistics, prices and wages';
COMMENT ON SCHEMA financial_sector  IS 'DBIE Financial Sector: monetary statistics, banking, financial institutions, NBFCs, key rates, payment systems';
COMMENT ON SCHEMA financial_markets IS 'DBIE Financial Markets: money, forex, government securities, equity and corporate debt markets';
COMMENT ON SCHEMA external_sector   IS 'DBIE External Sector: trade, international finance, external debt, reserves, external sector indices';
COMMENT ON SCHEMA public_finance    IS 'DBIE Public Finance: central, state and combined government finance, public debt';
COMMENT ON SCHEMA corporate_sector  IS 'DBIE Corporate Sector: FDI companies, non-government non-financial and NBFI companies, listed companies';
COMMENT ON SCHEMA socio_economic    IS 'DBIE Socio-Economic Indicators';
COMMENT ON SCHEMA surveys           IS 'DBIE Surveys, aggregated data (Survey of Professional Forecasters)';
COMMENT ON SCHEMA meta              IS 'Catalogue of every DBIE menu entry and SDMX dataset, code lists, provenance and load history';

CREATE TABLE IF NOT EXISTS meta.load_run (
    id          serial PRIMARY KEY,
    loader      text NOT NULL,
    started_at  timestamptz NOT NULL DEFAULT now(),
    finished_at timestamptz,
    git_commit  text,
    host        text,
    summary     jsonb
);
COMMENT ON TABLE meta.load_run IS 'One row per loader run (scripts/db/load-*.mjs)';

CREATE TABLE IF NOT EXISTS meta.sdmx_dataset (
    dsd_code          text PRIMARY KEY,
    element_id        text,
    label             text NOT NULL,
    sector            text,
    sub_sector        text,
    frequency         text,
    start_date        date,
    flow_type         text,
    is_alphanumeric   boolean,
    schema_name       text NOT NULL,
    table_name        text NOT NULL,
    columns           text[] NOT NULL,
    dimension_columns text[] NOT NULL,
    row_count         bigint NOT NULL,
    first_period      text,
    last_period       text,
    source_file       text NOT NULL,
    source_sha256     text,
    scraped_at        timestamptz,
    loaded_at         timestamptz NOT NULL DEFAULT now(),
    notes             text
);
COMMENT ON TABLE meta.sdmx_dataset IS 'One row per SDMX dataset loaded: DBIE identity, where its table is, and what was verified';

CREATE TABLE IF NOT EXISTS meta.sdmx_codelist (
    dsd_code        text NOT NULL,
    dim_code        text NOT NULL,
    dim_name        text,
    value_id        text NOT NULL,
    code            text,
    label           text,
    parent_value_id text,
    level           integer,
    PRIMARY KEY (dsd_code, dim_code, value_id)
);
COMMENT ON TABLE meta.sdmx_codelist IS 'DBIE code lists: the label and hierarchy behind every dimension code used in the SDMX tables';
CREATE INDEX IF NOT EXISTS sdmx_codelist_code ON meta.sdmx_codelist (dim_code, code);

CREATE TABLE IF NOT EXISTS meta.report (
    report_id     integer PRIMARY KEY,
    report_name   text NOT NULL,
    section       text NOT NULL,
    category      text,
    subsection    text,
    group_title   text,
    frequency     text,
    period_from   text,
    period_to     text,
    kind          text,
    document_id   text,
    document_name text,
    exported_at   timestamptz,
    schema_name   text,
    table_name    text,
    layout        text,          -- columns (c1..cN) or array (cells text[]), see load-reports.mjs
    files         jsonb,
    tabs          jsonb,
    row_count     bigint,
    width         integer,
    loaded_at     timestamptz,
    notes         text,
    meta          jsonb
);
COMMENT ON TABLE meta.report IS 'One row per DBIE Statistics or Publications report exported: identity, files, where its table is';
ALTER TABLE meta.report ADD COLUMN IF NOT EXISTS layout text;

CREATE TABLE IF NOT EXISTS meta.catalogue (
    entry_id    serial PRIMARY KEY,
    source      text NOT NULL CHECK (source IN ('statistics', 'publications', 'sdmx')),
    menu_path   text NOT NULL,
    title       text NOT NULL,
    report_id   integer,
    dsd_code    text,
    frequency   text,
    period_from text,
    period_to   text,
    kind        text NOT NULL,
    schema_name text,
    table_name  text,
    status      text NOT NULL,
    row_count   bigint,
    notes       text
);
COMMENT ON TABLE meta.catalogue IS 'Every DBIE menu entry (Statistics, Publications) and SDMX dataset, with the table that holds it and its load status';
CREATE INDEX IF NOT EXISTS catalogue_report_id ON meta.catalogue (report_id);
CREATE INDEX IF NOT EXISTS catalogue_dsd_code ON meta.catalogue (dsd_code);

CREATE OR REPLACE VIEW meta.tables AS
    SELECT 'sdmx'::text AS source, schema_name, table_name, label AS title,
           sector || ' > ' || sub_sector AS dbie_path, frequency, row_count, loaded_at
      FROM meta.sdmx_dataset
    UNION ALL
    SELECT lower(section), schema_name, table_name, report_name,
           concat_ws(' > ', section, category, subsection, group_title), frequency, row_count, loaded_at
      FROM meta.report
     WHERE table_name IS NOT NULL;
COMMENT ON VIEW meta.tables IS 'Every loaded table with its DBIE title and menu path';
