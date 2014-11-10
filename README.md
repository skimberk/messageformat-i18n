# MessageFormat i18n
This module exists in order to compile `.yaml` files with localisations in [ICU MessageFormat](http://icu-project.org/apiref/icu4j/com/ibm/icu/text/MessageFormat.html) into `.js` files which can be used easily throughout your application. The files generated are CommonJS compatible, meaning they will work with [NodeJS](http://nodejs.org/) and [browserify](http://browserify.org/). The files can also be used by themselves in the browser, with the localisations being available under `window.t`.

### Example
Initial directory structure:

    ./
        i18n/
            en/
                test.yaml
            fr/
                test.yaml
        index.js

Contents of `en/test.yaml`:

    plural: >
        You have {itemCount, plural,
            =0 {no items}
            one {1 item}
            other {# items}
        }.

Contents of `fr/test.yaml`:

    plural: >
        Vous {itemCount, plural,
            =0 {n'avez pas des objects}
            one {avez un objet}
            other {avez # objets}
        }.

Contents of `index.js`:

    var i18n = require('messageformat-i18n');
    i18n('./i18n/', './i18n-compiled/');

    var en = require('./i18n-compiled/en');
    var fr = require('./i18n-compiled/fr');

    console.log(en('test.plural', {itemCount: 3}));
    console.log(fr('test.plural', {itemCount: 0}));

Console output after running `node index.js`:

    > node index.js
    You have 3 items.
    Vous n'avex pas des objects.

Directory structure after running `node index.js`:

    ./
        i18n/
            en/
                test.yaml
            fr/
                test.yaml
        i18n-compiled/
            en.js
            fr.js
        index.js

I hope the example helped you figure out how to use this module. For more information, check out the documentation of [MessageFormat.js](https://github.com/SlexAxton/messageformat.js), which this module uses under the hood to parse the internationalisations.
