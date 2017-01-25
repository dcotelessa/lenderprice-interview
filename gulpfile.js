// Include gulp
var gulp = require('gulp');

// Include Our Plugins
var jshint = require('gulp-jshint');
var sass = require('gulp-sass');
var concat = require('gulp-concat');
var uglify = require('gulp-uglify');
var rename = require('gulp-rename');
var replace = require('gulp-replace');
//var jasmine = require('gulp-jasmine');

// Lint Task
gulp.task('lint', function() {
    return gulp.src('src/js/*.js')
        .pipe(jshint())
        .pipe(jshint.reporter('default'));
});

// Compile Our Sass with Bulma
gulp.task('sass', function() {
    return gulp.src(['node_modules/font-awesome/scss/font-awesome.scss','src/scss/*.scss'])
        .pipe(concat('app.scss'))
        .pipe(replace('@charset "utf-8"', '/*@charset "utf-8"*/'))
        .pipe(gulp.dest('dist'))
        .pipe(sass({includePaths: ['node_modules/font-awesome/scss/'], errLogToConsole: true}))
        .pipe(gulp.dest('dist'));
});

// Concatenate & Minify JS
gulp.task('scripts', function() {
    return gulp.src(['src/js/*.js'])
        //.pipe(jasmine())
        .pipe(concat('app.js'))
        .pipe(gulp.dest('dist'))
        .pipe(rename('app.min.js'))
        .pipe(uglify())
        .pipe(gulp.dest('dist'));
});

// Move Fonts
gulp.task('fonts', function() {
    return gulp.src('node_modules/font-awesome/fonts/*.*')
        .pipe(gulp.dest('dist/fonts'));
});

// Move HTML (no linting)
gulp.task('html', function() {
    return gulp.src('src/*.html')
        .pipe(gulp.dest('dist'));
});

// Move assets (no linting)
gulp.task('css', function() {
    return gulp.src(['node_modules/bulma/css/bulma.css'])
        .pipe(gulp.dest('dist/vendor'));
});

// Watch Files For Changes
gulp.task('watch', function() {
    gulp.watch('src/js/*.js', ['lint', 'scripts']);
    gulp.watch('src/scss/*.scss', ['sass']);
    gulp.watch('src/*.html', ['html']);
});

//init
gulp.task('init', ['lint', 'fonts', 'css', 'sass', 'scripts', 'html']);

// Default Task
gulp.task('default', ['init', 'watch']);
