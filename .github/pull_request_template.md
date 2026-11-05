## Cosa cambia

<!-- Ricette e file toccati, in breve. -->

## Controlli

- [ ] `uv run python -m unittest discover -s tests` passa
- [ ] `npx prettier --check '**/*.{yml,md}'` passa
- [ ] `uv run zensical build --clean -f zensical.toml` passa

## QA manuale

Aprire in anteprima locale, a larghezza telefono, ogni pagina cambiata:

- [ ] passi numerati in ordine, senza ripartire da 1 dopo foto o sotto-titoli
- [ ] "Dose per …" come prima riga degli ingredienti (se la dose è nota)
- [ ] foto al posto giusto tra i passi
- [ ] link funzionanti
- [ ] testo leggibile, niente Markdown grezzo visibile

Principi di design (vedi README):

- [ ] con JavaScript disattivato si naviga e si leggono le ricette
- [ ] in un browser testuale (`w3m -dump` o `links`) la pagina si legge in ordine, senza doppioni
- [ ] tutto si usa da tastiera, con il focus visibile
- [ ] l'inizio della ricetta (titolo e ingredienti) si vede nella prima schermata, su telefono, tablet e PC
