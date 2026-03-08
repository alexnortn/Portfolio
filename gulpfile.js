

"use strict";

let argv = require('yargs').argv,
    gulp = require('gulp'),
    concat = require('gulp-concat'),
    include = require('gulp-include'),
    pug = require('gulp-pug'), 
    replace = require('gulp-replace'),
    stylus = require('gulp-stylus'),
    uglify = require('gulp-uglify'),
    browserify = require('browserify'),
    cleanCss = require('gulp-clean-css'),
    autoprefixer = require('gulp-autoprefixer'),
    print = require('gulp-print'),
    sourcemaps = require('gulp-sourcemaps'),
    babel = require("gulp-babel"),
    source = require('vinyl-source-stream'),
    buffer = require('vinyl-buffer'),
    babelify = require('babelify'),
    browserify_shim = require('browserify-shim');

let fs = require('fs');
let del = require('del');
let path = require('path');
let extend = require('node.extend');

let BASEURL = argv.production
    ? 'https://design.alexnortn.com/'
    : '';


// Tasks will be defined below, build task at the end


gulp.task('images', gulp.parallel(
    function copyImages() {
        return gulp
            .src('./assets/images/**')
            .pipe(gulp.dest('./public/images/'));
    },
    function copyFavicons() {
        return gulp
            .src('./assets/favicon*')
            .pipe(gulp.dest('./public/'));
    }
));

gulp.task('clean', function () {
    return del([   
        './public/**'
    ]);
});

// Compile pug --> HTML
gulp.task('pug', function() {
    return gulp.src('views/**/*.pug')
        .pipe(pug({
            client: true,
        }))
        // replace the function definition
        .pipe(replace('function template(locals)', 'module.exports = function(locals, pug)'))
        .pipe(gulp.dest('./public/views_js'))
});

gulp.task('js', function () {
    let b = browserify({
        entries: 'clientjs/entry.js',
        //debug: true,
        // defining transforms here will avoid crashing your stream
        transform: [ babelify, browserify_shim ],
    });

    let stream = b.bundle()
        .pipe(source('bundle.min.js'))
        .pipe(buffer())
        .pipe(replace(/__BASE_URL/g, `'${BASEURL}'`));

    if (argv.production) {
        stream
            .pipe(sourcemaps.init())
                .pipe(uglify())
            .pipe(sourcemaps.write('./'))
    }

    return stream
        .pipe(gulp.dest('./public/js/'));

});

gulp.task('css', function () {
    return gulp.src([
        'assets/css/normalize.styl',
        'assets/css/main.styl'
    ])
        .pipe(concat('all.styl'))
        .pipe(stylus())
        .pipe(replace(/\$GULP_BASE_URL/g, BASEURL))
        .pipe(autoprefixer({
            overrideBrowserslist: ["> 1%", "last 2 versions", "Firefox ESR"]
        }))
        .pipe(cleanCss())
        .pipe(gulp.dest('./public/css/'));
});

gulp.task('fonts', function () {
    return gulp.src([
        'assets/fonts/**'
    ])
        .pipe(gulp.dest('./public/fonts/'));
});

gulp.task('plugins', function () {
    return gulp.src([
        'assets/plugins/**'
    ])
        .pipe(gulp.dest('./public/plugins/'));
});

gulp.task('watch', function () {
    gulp.watch([
        'assets/fonts/**'
    ], gulp.series('fonts'));

    gulp.watch([
        'assets/plugins/**'
    ], gulp.series('plugins'));

    gulp.watch([
        'assets/css/*'
    ], gulp.series('css'));

    gulp.watch([
        'assets/images/**'
    ], gulp.series('images'));

    gulp.watch([
        'clientjs/**',
        'components/**'
    ], gulp.series('js'));

    gulp.watch([
        'views/**',
    ], gulp.series('pug'));
});

// Only CSS + PUG + IMAGES (conserve juice)
gulp.task('watch-lite', function () {
    gulp.watch([
        'assets/css/*'
    ], gulp.series('css'));

    gulp.watch([
        'assets/images/**'
    ], gulp.series('images'));

    gulp.watch([
        'views/**',
    ], gulp.series('pug'));
});

// Build task with parallel execution
gulp.task('build', gulp.parallel('images', 'js', 'css', 'fonts', 'plugins'));

gulp.task('default', gulp.series('build'));