const gulp = require('gulp');
const htmlmin = require('gulp-htmlmin')
const sourcemaps = require('gulp-sourcemaps')
const babel = require('gulp-babel')
const sass = require('gulp-sass')(require('sass'))
const clean = require('gulp-clean')
var browserSync = require('browser-sync').create()
// const concat = require('gulp-concat');

// public babel present for disable async,generator transform, fix async function transform error
const BABEL_PRESENTS = [['@babel/preset-env', {
    "exclude": ["babel-plugin-transform-async-to-generator", "babel-plugin-transform-regenerator"]
}]]


// process images (not include svgs)
async function images() {
    const imagemin = (await import('gulp-imagemin')).default
    return gulp.src('src/assets/images/**', { since: gulp.lastRun(images) })
        .pipe(imagemin())
        .pipe(gulp.dest('dist/assets/images'));
}
// other assets copy directly
function assets() {
    return gulp.src(['src/assets/**/*','!src/assets/images/**/*']).pipe(gulp.dest('dist/assets'))
}
// page entry scripts
function entries() {
    return gulp.src('src/entries/**/*.js', { since: gulp.lastRun(entries) })
        .pipe(sourcemaps.init())
        .pipe(babel({
            presets: BABEL_PRESENTS,
            // plugins: ['@babel/transform-runtime']
        }))
        .pipe(sourcemaps.write('.'))
        .pipe(gulp.dest('dist'))
}
// page entry
function pages() {
    return gulp.src('src/pages/**/*.html', { since: gulp.lastRun(pages) })
        .pipe(htmlmin({ collapseWhitespace: true }))
        .pipe(gulp.dest('dist'));
}
// styles
function styles() {
    return gulp.src('src/styles/**/*.scss', { since: gulp.lastRun(styles) })
        .pipe(sass().on('error', sass.logError))
        .pipe(gulp.dest('./dist/styles'))
        .pipe(browserSync.stream());
};

// javascript public libs
function scripts() {
    return gulp.src('src/scripts/**/*.js', { since: gulp.lastRun(scripts) })
        .pipe(sourcemaps.init())
        .pipe(babel({
            presets: BABEL_PRESENTS,
            // plugins: ['@babel/transform-runtime']
        }))
        .pipe(sourcemaps.write('.'))
        .pipe(gulp.dest('dist/scripts'))
}

// web components
function wc_templates() {
    return gulp.src('src/components/templates/**/*.html', { since: gulp.lastRun(wc_templates) })
        .pipe(htmlmin({ collapseWhitespace: true }))
        .pipe(gulp.dest('dist/components/templates'));
}
function wc_elements() {
    return gulp.src('src/components/**/*.js', { since: gulp.lastRun(wc_elements) })
        .pipe(sourcemaps.init())
        .pipe(babel({
            presets: BABEL_PRESENTS,
            // plugins: ['@babel/transform-runtime']
        }))
        .pipe(sourcemaps.write('.'))
        .pipe(gulp.dest('dist/components'))
}
function wc_styles() {
    return gulp.src('src/components/styles/**/*.scss', { since: gulp.lastRun(styles) })
        .pipe(sass().on('error', sass.logError))
        .pipe(gulp.dest('./dist/components/styles'))
        .pipe(browserSync.stream());
}

// clean dist directory
function cleanBuild() {
    return gulp.src('dist', { read: false, allowEmpty: true })
        .pipe(clean());
}

function browser() {
    browserSync.init({
        server: './dist'
    })

    gulp.watch('src/scripts/**/*.js', gulp.series(scripts, function (cb) {
        browserSync.reload()
        cb()
    }))
    gulp.watch('src/pages/**/*.html', gulp.series(pages, function (cb) {
        browserSync.reload()
        cb()
    }))
    gulp.watch('src/entries/**/*.js', gulp.series(entries, function (cb) {
        browserSync.reload()
        cb()
    }))
    gulp.watch('src/styles/**/*.scss', gulp.series(styles))
    gulp.watch('src/assets/images/**', gulp.series(images, function (cb) {
        browserSync.reload()
        cb()
    }))
    gulp.watch('src/assets/!(images)/**/*', gulp.series(assets, function (cb) {
        browserSync.reload()
        cb()
    }))

    gulp.watch('src/components/templates/**/*.html', gulp.series(wc_templates, function (cb) {
        browserSync.reload()
        cb()
    }))
    gulp.watch('src/components/**/*.js', gulp.series(wc_elements, function (cb) {
        browserSync.reload()
        cb()
    }))
    gulp.watch('src/components/styles/**/*.scss', gulp.series(wc_styles, function (cb) {
        browserSync.reload()
        cb()
    }))
}

const build = gulp.series(cleanBuild, gulp.parallel(images, entries, assets, pages, scripts, styles, wc_elements, wc_templates,wc_styles))

exports.build = build

exports.dev = gulp.series(cleanBuild, build, gulp.parallel(browser))