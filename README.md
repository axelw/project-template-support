project-template-support
========================

Clones and updates project-template according to user provided information.

==================

After cloning this repo, `grunt --gruntfile crpr.js` is to be called. 

It takes one or more of the following arguments:


	--path=<path>		: 	specifies the parent folder in which the project is to be created. 
							If not	given, the project is created in the current working directory. 
							The folder specified by --path must already exist, it is never created.

	--name=<projectname>: 	specifies the name of the project. A folder of the same name is created
							in the folder specified by --path. If an item of that name already
							exists,	a message will be printed and the task exits,

	--db=<database>		:	schema or database name to be used. Defaults to <projectname> and is 
							saved in <projectname>.json

	--user=<name>		:	database user. Defaults to <projectname> and is saved 
							in <projectname>.json

	--password=<pwd>	:	password of database user. Defaults to <projectname> and is 
							saved in <projectname>.json

Usage example: grunt --gruntfile=crpr.js --name=test --db=mydb --user=me --password=secret

==================

This should have been it. Unfortunately, I was not able to execute any steps after cloning the 
the project-template repo.

##In fact, it turned into kind of a weird hack. 

To accomplish manipulation of clones template files, the `runner.sh` is called from within
the `crpr.js` gruntfile. It does some things, *and then* it calls `crpr.js` again to 
finalize the template files. Oh boy ...
