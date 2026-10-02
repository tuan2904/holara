# Vietnamese encoding maintenance

The original SQL seed contained replacement characters in reference data. This is
lost text, not a missing font. `holora_medical.sql` now contains clean UTF-8 for
new installations. Never re-import that baseline into an existing database.

For an existing MeDecode installation:

1. Back up `permission`, `role`, `specialty` and `holora_mind_chats`, including schema.
2. Verify the target is the isolated MeDecode database, not Holora Medical.
3. Run `docker/repair-vietnamese.sql` using the MySQL client or phpMyAdmin.
4. Reload the browser and verify specialties and permission descriptions.

The repair compares exact damaged values before updating them, preserving IDs,
customized clean text, accounts, role assignments and clinical records. It also
corrects the default title for new chats. Re-running the repair is safe. The DML
is transactional; MySQL executes the final default-value DDL separately.

The repair uses hex-encoded UTF-8 literals to avoid Windows shell encoding issues.
Do not attempt automatic conversion of damaged patient names or medical content:
replacement characters cannot reliably be decoded back to their original text.

Run regression checks from the MeDecode directory:

```sh
node --test scripts/encoding.test.mjs
node scripts/repair-vietnamese.mjs
```

`repair-vietnamese.mjs` defaults to a dry run. `--write` repairs the baseline and
generates the guarded migration only when damaged reference values remain. A clean
baseline does not overwrite the existing migration. The JSON mapping is reviewed
reference text, not a general-purpose encoding converter.
