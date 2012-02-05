# Changelog

 - 0.1.0 (not yet)
   - added the new features that latest HanslerSocket provided.
     - authentication.
     - in/filters.
     - increment/decrement.
     - get values before modification/deletion.
   - `limit` and `offset` optional arguments became the properties of `options` argument.
   - `Connection.end()` was renamed to `close()`.
   - `Connection` emits `'close'` event instead of '`end'`.

 - 0.0.3 (2010/11/21)
   - fixed NULL value handling once more.
   - improved error handling.

 - 0.0.2 (2010/11/08)
   - fixed NULL value handling.
   - fixed response handling for insert, update and remove.

 - 0.0.1 (2010/11/06)
   - fixed NULL value handling.

- 0.0.0 (2010/11/03)
  - first release.
