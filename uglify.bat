call uglifyjs key-polyfill.js encoding-polyfill.js findindex-polyfill.js find-polyfill.js objects.js interpolator.js changelimited.js analytics.js dom.js main.js facebook.js twitter.js --mangle toplevel --compress sequences,unsafe,comparisons,unsafe_comps,pure_getters,collapse_vars,reduce_vars,keep_fargs=false,passes=5 --screw-ie8 --output celestia.tmp.js
call uglifyjs FontLoader.js celestia.tmp.js --screw-ie8 --output celestia.min.js
del FontLoader.js
del key-polyfill.js
del encoding-polyfill.js
del findindex-polyfill.js
del find-polyfill.js
del objects.js
del interpolator.js
del changelimited.js
del dom.js
del main.js
del facebook.js
del twitter.js
del celestia.tmp.js
del "main - Copy.js"
del booststream.js