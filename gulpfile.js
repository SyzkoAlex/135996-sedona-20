const gulp = require("gulp");
const plumber = require("gulp-plumber");
const sourcemap = require("gulp-sourcemaps");
const sass = require("gulp-sass");
const postcss = require("gulp-postcss");
const autoprefixer = require("autoprefixer");
const sync = require("browser-sync").create();
const webp = require("gulp-webp");
const csso = require("gulp-csso");
const rename = require("gulp-rename");
const imagemin = require("gulp-imagemin");
const svgstore = require("gulp-svgstore");
const del = require("del");
const posthtml = require("gulp-posthtml");
const posthtmlInclude = require("posthtml-include");

const sourcePath = "source";
const buildPath = "build";

const makeStyles = () => {
  return gulp
    .src(`${sourcePath}/sass/style.scss`)
    .pipe(plumber())
    .pipe(sourcemap.init())
    .pipe(sass())
    .pipe(postcss([autoprefixer()]))
    .pipe(csso())
    .pipe(rename("styles.min.css"))
    .pipe(sourcemap.write("."))
    .pipe(gulp.dest(`${buildPath}/css`))
    .pipe(sync.stream());
};

exports.styles = makeStyles;

const makeWebp = () => {
  return gulp
    .src(`${sourcePath}/img/**/*.{jpg,png}`)
    .pipe(webp({ quality: 80 }))
    .pipe(gulp.dest(`${sourcePath}/img`));
};

exports.webp = makeWebp;

const optimizeImages = () => {
  return gulp
    .src(`${buildPath}/img/**/*.{jpg,png,svg}`)
    .pipe(
      imagemin([
        imagemin.optipng({ optimizationLevel: 3 }),
        imagemin.mozjpeg({ progressive: true }),
        imagemin.svgo(),
      ])
    )
    .pipe(gulp.dest(`${buildPath}/img`));
};

exports.images = optimizeImages;

const makeSvgSprite = () => {
  return gulp
    .src(`${sourcePath}/img/**/icon-*.svg`)
    .pipe(svgstore())
    .pipe(rename("sprite.svg"))
    .pipe(gulp.dest(`${buildPath}/img`));
};

exports.sprite = makeSvgSprite;

const makeHtml = () => {
  const config = (file) => ({
    plugins: [posthtmlInclude({ root: file.dirname })],
  });

  return gulp
    .src(`${sourcePath}/*.html`)
    .pipe(posthtml(config))
    .pipe(gulp.dest(buildPath));
};

exports.html = makeHtml;

const copy = () => {
  return gulp
    .src(
      [
        `${sourcePath}/fonts/**/*.{woff,woff2}`,
        `${sourcePath}/img/**`,
        `${sourcePath}/js/**`,
        `${sourcePath}/*.ico`,
      ],
      { base: sourcePath }
    )
    .pipe(gulp.dest(buildPath));
};

exports.copy = copy;

const clean = () => {
  return del(buildPath);
};

exports.clean = clean;

const runServer = (done) => {
  sync.init({
    server: {
      baseDir: buildPath,
    },
    cors: true,
    notify: false,
    ui: false,
  });
  done();
};

exports.server = runServer;

const watch = () => {
  gulp.watch(`${sourcePath}/sass/**/*.scss`, gulp.series(makeStyles));
  gulp
    .watch(`${sourcePath}/*.html`)
    .on("change", gulp.series(makeHtml, sync.reload));
};

const build = gulp.series(
  clean,
  copy,
  makeStyles,
  optimizeImages,
  makeSvgSprite,
  makeHtml
);

exports.build = build;

const start = gulp.series(build, runServer, watch);

exports.start = start;

exports.default = start;
