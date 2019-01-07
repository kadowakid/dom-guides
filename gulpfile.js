const gulp = require('gulp');
const pug = require('gulp-pug');
const sass = require('gulp-sass');
const watch = require('gulp-watch');
const plumber = require('gulp-plumber');
const data = require('gulp-data');
const jsonfile = require('jsonfile');
const named = require('vinyl-named');
const webpackStream = require("webpack-stream");
const webpack = require("webpack");

const webpackConfig = require("./webpack.config");

gulp.task('pug', () => {
    gulp.src('./src/pug/*.pug')
        .pipe(plumber())
        .pipe(data(() => {
            const manifest = './manifest.json';
            return json = jsonfile.readFileSync(manifest);
        }))
        .pipe(pug({
            pretty: true
        }))
        .pipe(gulp.dest('./prod/'));
});

gulp.task('sass', () => {
    gulp.src(['./src/sass/*.scss', './src/sass/_*.scss'])
        .pipe(plumber())
        .pipe(sass({
            outputStyle: 'expanded'
        }))
        .pipe(gulp.dest('./prod/css/'));
});

gulp.task('webpack', () => {
    gulp.src('./src/js/*.js')
        .pipe(plumber())
        .pipe(named())
        .pipe(webpackStream(webpackConfig, webpack))
        .pipe(gulp.dest('./prod/js'))
});

gulp.task('copy', () => {
    gulp.src('./manifest.json')
        .pipe(gulp.dest('./prod/'));
});

gulp.task('icon', () => {
    gulp.src('./src/icons/*')
        .pipe(gulp.dest('./prod/icons'));
});

gulp.task('watch', () => {
    watch('./src/pug/*.pug', () => {
        gulp.start(['pug']);
    });
    watch('./src/sass/*.scss', () => {
        gulp.start(['sass', 'webpack']);
    });
    watch('./src/js/*.js', () => {
        gulp.start(['webpack']);
    });
});

gulp.task('default', ['pug', 'sass', 'webpack', 'copy', 'icon']);