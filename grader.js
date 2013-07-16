#!/usr/bin/env node
/*
Automatically grade files for the presence of specified HTML tags/attributes.
Uses commander.js and cheerio. Teaches command line application development
and basic DOM parsing.

References:

 + cheerio
   - https://github.com/MatthewMueller/cheerio
   - http://encosia.com/cheerio-faster-windows-friendly-alternative-jsdom/
   - http://maxogden.com/scraping-with-node.html

 + commander.js
   - https://github.com/visionmedia/commander.js
   - http://tjholowaychuk.com/post/9103188408/commander-js-nodejs-command-line-interfaces-made-easy

 + JSON
   - http://en.wikipedia.org/wiki/JSON
   - https://developer.mozilla.org/en-US/docs/JSON
   - https://developer.mozilla.org/en-US/docs/JSON#JSON_in_Firefox_2

 + restler
   - https://github.com/danwrong/restler

*/

var fs = require('fs');
var program = require('commander');
var cheerio = require('cheerio');
var rest = require('restler');
var util = require('util');
var HTMLFILE_DEFAULT = "index.html";
var CHECKSFILE_DEFAULT = "checks.json";

var assertFileExists = function(infile) {
    var instr = infile.toString();
    if(!fs.existsSync(instr)) {
        console.log("%s does not exist. Exiting.", instr);
        process.exit(1); // http://nodejs.org/api/process.html#process_process_exit_code
    }
    return instr;
};

//var assertValidURL = function(url) {
//  var pattern = new RegExp('^(https?:\/\/)?'+ // protocol
//    '((([a-z\d]([a-z\d-]*[a-z\d])*)\.)+[a-z]{2,}|'+ // domain name
///    '((\d{1,3}\.){3}\d{1,3}))'+ // OR ip (v4) address
//    '(\:\d+)?(\/[-a-z\d%_.~+]*)*'+ // port and path
//    '(\?[;&a-z\d%_.~+=-]*)?'+ // query string
//    '(\#[-a-z\d_]*)?$','i'); // fragment locater
//  if(!pattern.test(url)) {
//    console.log("Invalid URL : %s" , url);
//    process.exit(1);
//  } else {
//    return url;
//  }
//}

var cheerioHtmlFile = function(htmlfile) {
    return cheerio.load(fs.readFileSync(htmlfile));
};

var loadChecks = function(checksfile) {
    return JSON.parse(fs.readFileSync(checksfile));
};

var checkHtmlFile = function(htmlfile, checksfile) {
    $ = cheerioHtmlFile(htmlfile);
    var checks = loadChecks(checksfile).sort();
    var out = {};
    for(var ii in checks) {
        var present = $(checks[ii]).length > 0;
        out[checks[ii]] = present;
    }
    return out;
};

var clone = function(fn) {
    // Workaround for commander.js issue.
    // http://stackoverflow.com/a/6772648
    return fn.bind({});
};

var buildfn = function(tempHtmlFile, checksFile) {
    var urlToFile = function(result, response) {
        if (result instanceof Error) {
            console.error('Error: ' + util.format(result.message));
        } else {
            console.error("Writing url text to %s", tempHtmlFile);
            fs.writeFileSync(tempHtmlFile, result);
            var checkJson = checkHtmlFile(tempHtmlFile, checksFile);
            var outJson = JSON.stringify(checkJson, null, 4);
            console.log(outJson);
        }
    };
    return urlToFile;
}

if(require.main == module) {
    program
        .option('-c, --checks <check_file>', 'Path to checks.json', clone(assertFileExists), CHECKSFILE_DEFAULT)
        .option('-f, --file <html_file>', 'Path to index.html', clone(assertFileExists), HTMLFILE_DEFAULT)
        .option('-u, --url <url>', 'url to check html')
        .parse(process.argv);
    var htmlFileName = program.file;
    if (program.url) {
        var tempHtmlFileName = "tempIndex" + Math.floor((Math.random() * 10000) + 1).toString() + ".html";
        var createHtmlFile = buildfn(tempHtmlFileName, program.checks);
        rest.get(program.url).on('complete',createHtmlFile);
        htmlFileName = tempHtmlFileName
    } else {
    
        var checkJson = checkHtmlFile(htmlFileName, program.checks);
        var outJson = JSON.stringify(checkJson, null, 4);
        console.log(outJson);
    }
} else {
    exports.checkHtmlFile = checkHtmlFile;
}
