

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
    rsync = require('gulp-rsync'),
    print = require('gulp-print'),
    sourcemaps = require('gulp-sourcemaps'),
    runSequence = require('run-sequence'),
    babel = require("gulp-babel"),
    shell = require('gulp-shell'),
    GulpSSH = require('gulp-ssh'),
    //sprite = require('gulp-node-spritesheet'),
    source = require('vinyl-source-stream'),
    buffer = require('vinyl-buffer'),
    gutil = require('gulp-util'),
    babelify = require('babelify'),
    browserify_shim = require('browserify-shim');

let fs = require('fs');
let del = require('del');
let path = require('path');
let extend = require('node.extend');

let BASEURL = argv.production
    ? 'https://design.alexnortn.com/'
    : '';


gulp.task('default', ['build']);

// Removed "pug"
gulp.task('build', [ 'images', 'js', 'css', 'fonts', 'plugins']);


gulp.task('images', [ ], function () {
    gulp
        .src('./assets/images/**')
        .pipe(gulp.dest('./public/images/'));

    gulp
        .src('./assets/favicon*')
        .pipe(gulp.dest('./public/'));
});

gulp.task('clean', function () {
    del([   
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

gulp.task('css', [ ], function () {
    gulp.src([
        'assets/css/normalize.css',
        'assets/css/main.styl',
        'assets/css/*.css',
    ])
        .pipe(concat('all.styl'))
        .pipe(stylus())
        .pipe(replace(/\$GULP_BASE_URL/g, BASEURL))
        .pipe(autoprefixer({
            browser: "> 1%, last 2 versions, Firefox ESR"
        }))
        .pipe(cleanCss())
        .pipe(gulp.dest('./public/css/'))
});

gulp.task('fonts', function () {
    gulp.src([
        'assets/fonts/**'
    ])
        .pipe(gulp.dest('./public/fonts/'))
})

gulp.task('plugins', function () {
    gulp.src([
        'assets/plugins/**'
    ])
        .pipe(gulp.dest('./public/plugins/'))
})

gulp.task('watch', function () {
    gulp.watch([
        'assets/animations/**'
    ], [ 'animations' ]);

    gulp.watch([
        'assets/fonts/**'
    ], [ 'fonts' ]);

    gulp.watch([
        'assets/plugins/**'
    ], [ 'plugins' ]);

    gulp.watch([
        'assets/css/*'
    ], [ 'css' ]);

    gulp.watch([
        'assets/images/**'
    ], [ 'images' ]);

    gulp.watch([
        'clientjs/**',
        'components/**'
    ], [ 'js' ]);

    gulp.watch([
        'views/**',
    ], [ 'pug' ]);
});

// Only CSS + PUG + IMAGES (conserve juice)
gulp.task('watch-lite', function () {
    gulp.watch([
        'assets/css/*'
    ], [ 'css' ]);

    gulp.watch([
        'assets/images/**'
    ], [ 'images' ]);

    gulp.watch([
        'views/**',
    ], [ 'pug' ]);
});