var _ = require('underscore'),
    gulp = require('gulp'),
    source = require('vinyl-source-stream'),

    compass = require('gulp-compass'),
    rename = require('gulp-rename'),
    livereload = require('gulp-livereload'),
    del =  require('del'),

    // automatically .$inject
    ngAnnotate = require('gulp-ng-annotate');

    // TODO for release
    //uglify = require('gulp-uglify'),

    // CommonJS
    browserify = require('browserify'),
    // TODO live reload
    watchify = require('watchify'),
    // es6, jsx
    babelify = require('babelify');

var paths = {
  base: 'frontend', // source base directory
  dest: 'static',   // destination base directory
  entry: 'app.js',    // entry script point

  scripts: 'app',     // -> 'dest/app.js'
  styles: 'sass',  // -> 'dest/styles.css'
  images: 'img',
  fonts: 'fonts',
  templates: 'templates'
}

var path = function(p, full) {
  p = p.split('/').map(function(i) {
    return paths[i] || i;
  }).join('/')
  return full? __dirname + '/' + p : p;
}

// SCRIPTS
gulp.task('scripts-clean', function (cb) {
  del([path('dest/entry')], cb)
})
gulp.task('scripts-watch', ['scripts-clean'], function() {
  bundler = watchify(
    makeBrowserifyBundler(
      _.assign({}, watchify.args, {
        debug: true //source maps
      })
    )
  )
  bundler
    .on('update', function() {
      return bundle(bundler).pipe(livereload())
    })
    .on('log', console.log)
    .transform(babelify)

  return bundle(bundler)
});
gulp.task('scripts', ['scripts-clean'], function() {
  var bundler = makeBrowserifyBundler()
  bundler.transform(babelify)
  return bundle(bundler);
});

// STYLES
gulp.task('styles-clean', function (cb) {
  del([path('dest/styles.css')], cb)
})
gulp.task('styles', ['styles-clean', 'fonts'], function () {
  return gulp.src(path('base/styles/app.sass'))
    .pipe(
      compass({
        // TODO for production use compressed and disable sourcemaps
        //style: 'compressed',
        style: 'expanded',
        sourcemap: true,
        font: path('dest/fonts', true),
        image: path('images'),
        generated_images_path: path('dest/images', true),
        sass: path('styles'),
        css: path('dest', true),
        relative: false,
        project: path('base', true),
        http_path: '/' + path('dest'),
      })
    )
    .on('error', error)
    .pipe(rename(function(p) {
      p.basename = 'styles'
    }))
    .pipe(gulp.dest(path('dest')))
    .pipe(livereload());
});

// FONTS
gulp.task('fonts-clean', function (cb) {
  del([path('dest/fonts')], cb)
})
gulp.task('fonts', ['fonts-clean'], function () {
  return gulp.src(path('base/fonts') + '/**')
    .pipe(gulp.dest(path('dest/fonts')));
});

// IMAGES
gulp.task('images-clean', function (cb) {
  del([path('dest/images')], cb)
})
gulp.task('images', ['images-clean'], function () {
  return gulp.src(path('base/images') + '/**')
    .pipe(gulp.dest(path('dest/images')));
});

// TEMPLATES
gulp.task('templates-clean', function (cb) {
  del([path('dest/templates')], cb)
})
gulp.task('templates', ['templates-clean'], function () {
  return gulp.src(path('base/**/templates') + '/**')
    .pipe(gulp.dest(path('dest/templates')));
});

// BASE TASKS
gulp.task('clean', function(cb) {
  del([path('dest')], cb);
});

// TODO jade templates?

gulp.task('watch', function() {
  livereload.listen()
  gulp.watch(path('base/**/templates') + '/**', ['templates']);
  gulp.watch(path('base/images') + '/**', ['images']);
  gulp.watch(path('base/fonts') + '/**', ['fonts']);
  gulp.watch(path('base/styles') + '/**', ['styles']);
  gulp.watch(path('base/images/sprites') + '/**', ['styles']);
});

gulp.task('build-assets', ['styles', 'images', 'fonts', 'templates'])
gulp.task('build', ['scripts', 'build-assets'])
gulp.task('build-watch', ['scripts-watch', 'build-assets'])

gulp.task('default', ['clean'], function() {
  gulp.start('build-watch', 'watch')
});

// TODO minify task
function makeBrowserifyBundler(options) {
  options = _.assign({}, options || {}, {
    basedir: path('base/scripts'),
    paths: [path('base/scripts', true)],
    entries: path('entry'),
    extensions: ['.jsx'],
  })
  return browserify(options)
}

function bundle(bundler) {
  return bundler.bundle()
          .on('error', error)
          .pipe(source(path('entry')))
          .pipe(ngAnnotate())
          .pipe(gulp.dest(path('dest')));
}

function error (error) {
  console.log(error.toString());
  this.emit('end');
}