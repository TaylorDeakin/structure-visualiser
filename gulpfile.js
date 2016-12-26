var gulp = require('gulp');
var sass = require('gulp-sass');
var sourcemaps = require('gulp-sourcemaps');
var autoprefixer = require('gulp-autoprefixer');

gulp.task('default', function () {
    // place code for your default task here
});

gulp.task('sass', function () {
    return gulp.src("./res/styles.scss")
        .pipe(sourcemaps.init())
        .pipe(sass().on('error', sass.logError))
        .pipe(sourcemaps.init())
        .pipe(autoprefixer())
        .pipe(gulp.dest('./res'))
});

gulp.task('sass:watch', function () {
    gulp.watch('./res/*.scss', ['sass']);
});