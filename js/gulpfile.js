"use strict";

const watchify = require("watchify");
const browserify = require("browserify");
const tsify = require("tsify");
const babelify = require("babelify");
const gulp = require("gulp");
const source = require("vinyl-source-stream");
const buffer = require("vinyl-buffer");
const log = require("fancy-log");
const uglify = require("gulp-uglify");
const sourcemaps = require("gulp-sourcemaps");
const connect = require("gulp-connect");

const paths = {
  pages: ["src/*.html"],
};

gulp.task("copy-html", function () {
  return gulp.src(paths.pages)
    .pipe(gulp.dest("dist"));
});

let b = watchify(browserify({
  basedir: ".",
  debug: true,
  entries: ["src/main.ts"],
  cache: {},
  packageCache: {},
}));
b.plugin(tsify)
  .transform(babelify, {
    presets: ["es2015"],
    extensions: [".ts"],
  });

gulp.task("connect", async function () {
  return connect.server({
    root: "dist",
    livereload: true,
    port: 5500,
  });
})

gulp.task("default", gulp.series(
  gulp.parallel("copy-html"),
  bundle,
  "connect"
));
b.on("update", bundle);
b.on("log", log.info.bind(log));

function bundle() {
  return b.bundle()
    .on("error", log.error.bind(log))
    .pipe(source("bundle.js"))
    .pipe(buffer())
    .pipe(sourcemaps.init({ loadMaps: true }))
    .pipe(uglify({ mangle: false, }))
    .pipe(sourcemaps.write(".", {
      includeContent: false,
      sourceRoot: "webpack://",
    }))
    .pipe(gulp.dest("dist"))
    .pipe(connect.reload());
}
