# Contributing Frontend

## Start locally

```
cd ./Frontend/gis

npm install

npm start
```

## Start with docker

```
docker-compose up
```

## Environment file

Check the file in `src/environments/environment.ts` and adjust the URLs.

## Translation

1. Look at all html files in the app folder ./src/app/**.html.
2. If there is a file that and a tag does not contain an `i18n` tag, add it. This is the format: `i18n="$MEANING | $DESCRIPTION @@ $ID"`.
Everything is optional but we recommend to set the $ID tag with `i18n="@@$ID"` at least. Otherwise a random unique identifier will be provided by angular which might change over time. The other two attributes are just to give the translator context information.
3. It is possible to also translate tag/attribute contents, e.g., of a 'title' attribute: `<p title="blaTitle" i18n-title="@@blaTitle"  i18n="@@bla">Translation for bla </p>`
4. Once you have added the `i18n` tags, go to `./Frontend/gis/` and run `npm run-script extract-i18n`; it will create a `src/i18n/messages.xlf` file (IGNORE THIS FILE), and update the existing `messages.en.xlf` and `messages.de.xlf` files. These are the files you should use for translating the app.
5. In the files, put your translation into the `<target></target>` sections.
6. Run `npm run-script start-en` or `npm run-script start-de` to start a local dev server and see your translations in action.
7. As of right now you have to stop the dev server and restart it to see changes to your translateion.