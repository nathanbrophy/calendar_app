module.exports = function(grunt){
	grunt.initConfig({
		pkg:grunt.file.readJSON('package.json'),
		
		// Compile Angular Templates
		ngtemplates:  {
		  app:        {
			cwd:	  '../src/templates',	
			src:      '**.html',
			dest:     'template.js',
			options:  {
			  module: 'dynamicCal',
			  //usemin: 'ngCal.js'
			}
		  }
		},
		
		// Compile the entire Angular
		concat:   {
		  app:    {
			//src:  [ '../src/directives/**.js', '../src/services/**.js', '../src/filters/**.js', '<%= ngtemplates.app.dest %>' ],
			src:  [ '../src/directives/**.js', '../src/services/**.js', '../src/filters/**.js', '../src/templates/**.js','<%= ngtemplates.app.dest %>' ],
			dest: '../dist/js/ngDynamicCal.js'
		  }
		},
		copy: {
		  main: {
			src: '../src/main.css',
			dest: '../dist/css/ngDynamicCal.css'
		  }
		},
		cssmin: {
		  options: {
			shorthandCompacting: false,
			roundingPrecision: -1
		  },
		  target: {
			files: {
			  '../dist/css/ngDynamicCal.min.css': ['../dist/css/ngDynamicCal.css']
			}
		  }
		},
		// Minify
		uglify: {
		  my_target: {
		    files: {
			  '../dist/js/ngDynamicCal.min.js': ['../dist/js/ngDynamicCal.js']
		    }
		  }
	    },
	    usebanner: {
			taskName: {
			  options: {
				position: 'top',
				banner: '/*! <%= pkg.name %> - v<%= pkg.version %> - ' + '<%= grunt.template.today("yyyy-mm-dd") %> */\n',
				linebreak: false
			  },
			  files: {
				src: ['../dist/css/ngDynamicCal.min.css', '../dist/js/ngDynamicCal.min.js']
			  }
			}
		  },
	});
	grunt.loadNpmTasks('grunt-angular-templates');
	grunt.loadNpmTasks('grunt-contrib-concat');
	grunt.loadNpmTasks('grunt-contrib-uglify');
	grunt.loadNpmTasks('grunt-contrib-copy');
	grunt.loadNpmTasks('grunt-contrib-cssmin');
	grunt.loadNpmTasks('grunt-banner');
	grunt.registerTask("default", ["ngtemplates", "concat", "copy", "cssmin", "uglify", 'usebanner']);
	
	
	
}