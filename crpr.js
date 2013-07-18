/*global module:false*/
module.exports = function(grunt) {
	'use strict';

	// Project configuration.
	grunt.initConfig({
	});

	var fs = require('fs'),
		pth = require('path');

	grunt.registerTask('help', 'prints custom help messages', function(){
		grunt.log.writeln();
		grunt.log.writeln('All options take the form --option=myOption');
		grunt.log.writeln();
		grunt.log.writeln('--path=<path>		: specifies the parent folder in which the project is to be created. If not');
		grunt.log.writeln('                   	  given, the project is created in the current working directory. The folder');
		grunt.log.writeln('                   	  specified by --path must already exist, it is never created.');
		grunt.log.writeln();
		grunt.log.writeln('--name=<projectname>	: specifies the name of the project. A folder of the same name is created');
		grunt.log.writeln('                   	  in the folder specified by --path. If an item of that name already exists,');
		grunt.log.writeln('                   	  a message will be printed and the task exits.');
		grunt.log.writeln();
		grunt.log.writeln('--db=<database>		: schema or database name to be used. Defaults to <projectname> and is saved in <projectname>.json');
		grunt.log.writeln();
		grunt.log.writeln('--user=<name>		: database user. Defaults to <projectname> and is saved in <projectname>.json');
		grunt.log.writeln();
		grunt.log.writeln('--password=<pwd>	: password of database user. Defaults to <projectname> and is saved in <projectname>.json');
		grunt.log.writeln();
		grunt.log.writeln('Usage example: grunt --gruntfile=crpr.js --name=test --db=mydb --user=me --password=secret');
	});

	function exit(msg, opt){
		if ( opt ) opt.print();
		grunt.log.writeln();
		grunt.fail.fatal(msg + '\nUse \'grunt --gruntfile=crpr.js help\' for help.\n');
	};

	function decorate(p){
		p.print = function(){
			grunt.log.writeln(JSON.stringify(this, null, 4));
		}
		p.fqn = function(){
			return pth.normalize(this.path + '/' + this.name);
		};
		p.check = function(){
			if ( !this.path ) exit('Missing project path', this);
			if ( !grunt.file.exists(this.path) ) exit('Cannot find ' + this.path, this);
			if ( !this.name ) exit('Missing project name', this);
			if ( grunt.file.exists(this.fqn()) ) exit(this.fqn() + ' already exists.', this);
		};
		return p;
	}

	grunt.registerTask('default', 'creates a new project', function(){
		var prj = {};
		decorate(prj);

		prj.path = pth.resolve(grunt.option('path') || '.');
		prj.name = grunt.option('name');
		prj.db = grunt.option('db') || prj.name;
		prj.user = grunt.option('user') || prj.name;
		prj.password = grunt.option('password') || prj.name;

		prj.check();

		fs.writeFileSync('__intermediate.json', JSON.stringify(prj), {flag: 'w'});

		// use bash for cloning. For the reason to do so see comments on __cloneProjectTemplate
		var git = grunt.util.spawn({
				cmd : "./runner.sh",
				args : [ prj.name ],
				opts: { stdio: 'inherit' }
			}, function (err, result) {
				// never called ...
				grunt.log.writeln('callback...');
				if (err) 
					exit(err);

				grunt.log.writeln(result);
		});
	});

	// grunt.registerTask('__cloneProjectTemplate', 'clones the project template from git', function(){
		// var prj = grunt.config.get('projOptions');
		// if( !prj ) exit('No project information available.');


		// Unfortunately, though both variants have the same result, neither works as expected.
		// The git repo gets successfully cloned, but when that's finished, the main grunt 
		// process has already exited, and the tasks which should be called after cloning never get
		// called. When process.on(exit) is invoked, the cloning is not really finished, so
		// calling the next grunt task from there doesn't help. Furthermore, the spawned child
		// process needs to be terminated with a keystroke on the terminal.

		// variant 1: using node
		// var spawn = require('child_process').spawn;
		// var git = spawn('git', [ "clone", "https://github.com/axelw/project-template.git", prj.fqn() ],
		// 						{ stdio: 'inherit' }
		// );

		// variant 2: using grunt
		// var git = grunt.util.spawn({
		// 		cmd : "git",
		// 		args : [ "clone", "https://github.com/axelw/project-template.git", prj.fqn() ],
		// 		opts: { stdio: 'inherit' }
		// 	}, function (err, result) {
		// 		grunt.log.writeln('callback...');
		// 		if (err) 
		// 			exit(err);

		// 		grunt.log.writeln(result);
		// 		grunt.task.run('__finishProjectTemplate');		
		// });

		// process.on('exit', function (code) {
	 	// 	 	grunt.log.writeln('child process exited with code ' + code);
		// 	grunt.log.writeln('calling task');

		// variant 1: 
		// 	var g = spawn('grunt', [ '__finishProjectTemplate' ],
		// 			{ stdio: 'inherit' }
		   
		// variant 2:    
  		//	var g = grunt.util.spawn({cmd: 'grunt', args: [ '__finishProjectTemplate' ],
		// 			opts: { stdio: 'inherit' }}, function(err, result){
		// 				grunt.log.writeln('next callback...');	
		// 		}
	 	//	);

  		//	grunt.task.run('__finishProjectTemplate');
  		//	grunt.log.writeln('task called');
		// });
	// });

	grunt.registerTask('__finishProjectTemplate', 'finish the project template', function(){
		var prj;

		try{
			prj = JSON.parse(fs.readFileSync('__intermediate.json', 'utf8'));
		}catch(err){
			console.log(err);
			process.exit();
		} 		

		if( !prj ) exit('No project information available.');
		decorate(prj);

		// rename workspace file
		fs.renameSync( prj.fqn() + '/template.sublime-workspace', 
						prj.fqn() + '/' + prj.name + '.sublime-workspace');

		// write project file
		fs.writeFileSync(prj.fqn() + '/' + prj.name + '.sublime-project', 
						JSON.stringify(
							JSON.parse('{"folders":[{"path":"' + prj.fqn() + '","file_exclude_patterns":' + 
										'["' + prj.fqn() + '/' + prj.name + '.sublime-*"]}]}'), null, 4));

		// write server config file
		fs.writeFileSync(prj.fqn() + '/server.json', 
					JSON.stringify(JSON.parse('{"title":"'+prj.name+'","nodeport":"3000","host":"localhost","user": "'+ 
								prj.user+'","password":"'+prj.password+'","database":"'+ prj.db+
								'","port":"3306","key":"CruSer","secret": "development"}'), null, 4));

		// write package.json
		fs.writeFileSync(prj.fqn() + '/package.json', 
					JSON.stringify(JSON.parse('{"private": true,"name": "' + prj.name + '","version": "0.1.0",' +
								'"description": "' + prj.name + '",	"main": "server.js","dependencies": {' +
								'"express": "3.0.6","mustache": "0.7.2","mustache-express": "0.2.1","mysql": "2.0.0-alpha8",'+
								'"connect-mysql": "0.2.7","moment": "2.0.0","underscore": "1.5.x","backbone": "1.0.0"},' +
								'"devDependencies": {"grunt-init": "0.2.1"},"scripts": {"test": "echo \\"Error: no test specified\\" && exit 1"'+
								'},"repository": "","author": "axelw","license": "MIT"}'), null, 4));

		grunt.file.delete('__intermediate.json');

		// the rest, namely 'npm install', is executed via bash
	});
};
