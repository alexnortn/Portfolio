
"use strict";

const gulp = require('gulp');
const { src, dest, series, parallel, watch } = gulp;
const argv = require('yargs').argv;
const concat = require('gulp-concat');
const include = require('gulp-include');
const pug = require('gulp-pug');
const replace = require('gulp-replace');
const stylus = require('gulp-stylus');
const terser = require('gulp-terser');
const browserify = require('browserify');
const cleanCss = require('gulp-clean-css');
const autoprefixer = require('gulp-autoprefixer');
const sourcemaps = require('gulp-sourcemaps');
const source = require('vinyl-source-stream');
const buffer = require('vinyl-buffer');
const babelify = require('babelify');
const browserify_shim = require('browserify-shim');
const del = require('del');

const BASEURL = argv.production
    ? 'https://design.alexnortn.com/'
    : '';

// Clean task
function clean() {
    return del(['./public/**']);
}

// Images task
function images() {
    src('./assets/favicon*')
        .pipe(dest('./public/'));

    return src('./assets/images/**')
        .pipe(dest('./public/images/'));
}

// Compile pug --> HTML
function pugTask() {
    return src('views/**/*.pug')
        .pipe(pug({
            client: true,
        }))
        .pipe(replace('function template(locals)', 'module.exports = function(locals, pug)'))
        .pipe(dest('./public/views_js'));
}

// JavaScript task
function js(done) {
    const b = browserify({
        entries: 'clientjs/entry.js',
        transform: [babelify, browserify_shim],
    });

    let stream = b.bundle()
        .pipe(source('bundle.min.js'))
        .pipe(buffer())
        .pipe(replace(/__BASE_URL/g, `'${BASEURL}'`));

    if (argv.production) {
        stream = stream
            .pipe(sourcemaps.init({ loadMaps: true }))
            .pipe(terser())
            .pipe(sourcemaps.write('./'));
    }

    stream.pipe(gulp.dest('./public/js/'))
        .on('end', done)
        .on('error', done);
}

// CSS task
function css() {
    return src([
        'assets/css/normalize.styl',
        'assets/css/main.styl',
        'assets/css/*.css',
    ], { allowEmpty: true })
        .pipe(concat('all.styl'))
        .pipe(stylus())
        .pipe(replace(/\$GULP_BASE_URL/g, BASEURL))
        .pipe(autoprefixer({
            overrideBrowserslist: ["> 1%", "last 2 versions", "Firefox ESR"]
        }))
        .pipe(cleanCss())
        .pipe(dest('./public/css/'));
}

// Fonts task
function fonts() {
    return src('assets/fonts/**')
        .pipe(dest('./public/fonts/'));
}

// Plugins task
function plugins() {
    return src('assets/plugins/**')
        .pipe(dest('./public/plugins/'));
}

// Watch task
function watchFiles() {
    watch('assets/fonts/**', fonts);
    watch('assets/plugins/**', plugins);
    watch('assets/css/*', css);
    watch('assets/images/**', images);
    watch(['clientjs/**', 'components/**'], js);
    watch('views/**', pugTask);
}

// Watch lite task (CSS + PUG + IMAGES only)
function watchLite() {
    watch('assets/css/*', css);
    watch('assets/images/**', images);
    watch('views/**', pugTask);
}

// Build task
const build = parallel(images, js, css, fonts, plugins);

// Export tasks
exports.clean = clean;
exports.images = images;
exports.pug = pugTask;
exports.js = js;
exports.css = css;
exports.fonts = fonts;
exports.plugins = plugins;
exports.watch = watchFiles;
exports['watch-lite'] = watchLite;
exports.build = build;
exports.default = build;
