var fs = require('fs')
var paths = require('path')

function VdocWebpackPlugin(options){
    global.__vdoc_ob__  = {}
    global.__vdoc__ = {}

    this.options = options;
    this.readFolder(options.doc, ['swp'].concat(options.ignore || []))
    try{
        fs.statSync(options.outFile).isFile()
    }
    catch(e){
        fs.writeFileSync(options.outFile, JSON.stringify(global.__vdoc_ob__))
    }
}

VdocWebpackPlugin.prototype.readFolder = function(path, ignore){
    var self = this;
    if(Array.isArray(path)){
        path.forEach(function(p){
            self.readFolder(p, ignore)
        })
    }
    else if(typeof path === 'string'){
        if(fs.statSync(path).isDirectory()) {
            var stat = fs.readdirSync(path)
            !!stat.length
            ? stat.forEach(function(file) {
                self.readFolder(path + "/" + file, ignore)
            })
            : console.log(`It is a empty folder ${path}`)
        }
        else if(fs.statSync(path).isFile()) {
            var p = paths.parse(path.slice(0))
            if(ignore.indexOf(p.ext) == -1){
                var route = p.dir.slice(p.dir.indexOf('/')) + '/' + p.name
                global.__vdoc_ob__[route] = Object.assign({}, p, {
                    path: p.dir + '/' + p.base,
                    route: route
                })
            }
        }
    }
}

VdocWebpackPlugin.prototype.apply = function(compiler){
    var options = this.options;
    var _cbk = null;
    !!options && !!options.doc && !!options.outFile && compiler.plugin('run', function(compilation, callback) {
        callback()
        _cbk = callback;
    })

    compiler.plugin('compilation', function(compilation) {
        compilation.plugin('before-chunk-assets', function(chunks) {
            Object.keys(global.__vdoc_ob__).forEach(function(key){
                global.__vdoc_ob__[key].config = global.__vdoc__[key]
            })

            var currentPath = paths.join(process.cwd(), options.outFile)
            compilation.chunks.forEach(function(chunk){
                chunk.origins.forEach(function(o){
                    if(o.module.resource == currentPath){
                        var _replace_vdoc_config = JSON.stringify(global.__vdoc_ob__)
                        var _pre_value = o.module._source._value
                        o.module._source._value = _pre_value.split('module.exports')[0] + 'module.exports = ' + _replace_vdoc_config;
                    }
                })
            })
        })
    })
}

module.exports = VdocWebpackPlugin;
