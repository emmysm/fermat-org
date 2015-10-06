/*jshint -W069 */
var winston = require('winston');
var request = require('request');
var parseString = require('xml2js').parseString;
var platfrmMod = require('../platform');
var suprlayMod = require('../superlayer');
var layerMod = require('../layer');
var compMod = require('../component');
var devMod = require('../developer');

//var db = require('../../../db');

//var USER_AGENT = 'Miguelcldn';
//var USER_AGENT = 'MALOTeam'
var USER_AGENT = 'fuelusumar';
//var TOKEN = '3c12e4c95821c7c2602a47ae46faf8a0ddab4962'; // Miguelcldn    
//var TOKEN = 'fb6c27928d83f8ea6a9565e0f008cceffee83af1'; // MALOTeam
var TOKEN = '2086bf3c7edd8a1c9937794eeaa1144f29f82558'; // fuelusumar

/**
 * [processCompList description]
 *
 * @method processCompList
 *
 * @param  {[type]}        section  [description]
 * @param  {[type]}        layer    [description]
 * @param  {[type]}        compList [description]
 * @param  {[type]}        type     [description]
 *
 * @return {[type]}        [description]
 */
var processCompList = function(section, layer, compList, type) {
    var comps = [];
    for (var i = 0; i < compList.length; i++) {
        var comp = {};
        comp = processComp(section, layer, compList[i], type);
        comps.push(comp);
    }
    return comps;
};

/**
 * [processComp description]
 *
 * @method processComp
 *
 * @param  {[type]}    section [description]
 * @param  {[type]}    layer   [description]
 * @param  {[type]}    comp    [description]
 * @param  {[type]}    type    [description]
 *
 * @return {[type]}    [description]
 */
var processComp = function(section, layer, comp, type) {
    var proComp = {};
    proComp = comp['$'];
    proComp.type = type;
    proComp.repo_dir = getRepoDir(section.code, layer.name, type, proComp.name, 'bitdubai');
    var devs = [];
    var _authors = comp.authors && comp.authors[0] && comp.authors[0].author ? comp.authors[0].author : [];
    var _mantainers = comp.mantainers && comp.mantainers[0] && comp.mantainers[0].mantainer ? comp.mantainers[0].mantainer : [];
    var _life_cycle = comp.life_cycle && comp.life_cycle[0] && comp.life_cycle[0].status ? comp.life_cycle[0].status : [];
    for (var i = 0; i < _authors.length; i++) {
        var dev = {};
        dev = _authors[i]['$'];
        dev.role = 'author';
        devs.push(dev);
    }
    for (var i = 0; i < _mantainers.length; i++) {
        var dev = {};
        dev = _mantainers[i]['$'];
        dev.role = 'mantainer';
        devs.push(dev);
    }
    proComp.devs = devs;
    var life_cycle = [];
    for (var i = 0; i < _life_cycle.length; i++) {
        var status = {};
        status = _life_cycle[i]['$'];
        life_cycle.push(status);
    }
    proComp.life_cycle = life_cycle;
    return proComp;
};

/**
 * [getRepoDir description]
 *
 * @method getRepoDir
 *
 * @param  {[type]}   section [description]
 * @param  {[type]}   layer   [description]
 * @param  {[type]}   type    [description]
 * @param  {[type]}   comp    [description]
 * @param  {[type]}   team    [description]
 *
 * @return {[type]}   [description]
 */
var getRepoDir = function(section, layer, type, comp, team) {
    var _root = "fermat",
        _section = section ? section.toUpperCase().split(' ').join('_') : null,
        _type = type ? type.toLowerCase().split(' ').join('_') : null,
        _layer = layer ? layer.toLowerCase().split(' ').join('_') : null,
        _comp = comp ? comp.toLowerCase().split(' ').join('-') : null;
    _team = team ? team.toLowerCase().split(' ').join('-') : null;
    if (_section && _type && _layer && _comp && _team) {
        return _section + "/" + _type + "/" + _layer + "/" +
            _root + "-" + _section.split('_').join('-').toLowerCase() + "-" + _type.split('_').join('-') + "-" + _layer.split('_').join('-') + "-" + _comp + "-" + _team;
    } else {
        return null;
    }
};

/**
 * [doRequest description]
 *
 * @method doRequest
 *
 * @param  {[type]}   method   [description]
 * @param  {[type]}   url      [description]
 * @param  {[type]}   params   [description]
 * @param  {Function} callback [description]
 *
 * @return {[type]}   [description]
 */
var doRequest = function(method, url, params, callback) {
    try {
        url += '?access_token=' + TOKEN;
        switch (method) {
            case 'POST':
                var form = {};
                if (params && Array.isArray(params) && params.length > 0) {
                    for (var i = params.length - 1; i >= 0; i--) {
                        form[params[i].key] = params[i].value;
                    }
                }
                request.post({
                    url: url,
                    form: form,
                    headers: {
                        'User-Agent': USER_AGENT,
                        'Accept': 'application/json'
                    }
                }, function(err, res, body) {
                    callback(err, body);
                });
                break;
            case 'GET':
                request.get({
                    url: url,
                    headers: {
                        'User-Agent': USER_AGENT,
                        'Accept': 'application/json'
                    }
                }, function(err, res, body) {
                    callback(err, body);
                });
                break;
        }
    } catch (err) {
        callback(err, null);
    }
};

/**
 * [processRequestBody description]
 *
 * @method processRequestBody
 *
 * @param  {[type]}           body     [description]
 * @param  {Function}         callback [description]
 *
 * @return {[type]}           [description]
 */
var processRequestBody = function(body, callback) {
    try {
        var reqBody = JSON.parse(body);
        if (reqBody.content && reqBody.encoding) {
            var content = new Buffer(reqBody.content, reqBody.encoding);
            var strCont = content.toString().split('\n').join(' ').split('\t').join(' ');
            callback(null, strCont);
        } else if (reqBody.login || reqBody.message || Array.isArray(reqBody)) {
            callback(null, reqBody);
        } else {
            callback(new Error('body without any content'), null);
        }
    } catch (err) {
        callback(err, null);
    }
};

/**
 * [getManifest description]
 *
 * @method getManifest
 *
 * @param  {Function}  callback [description]
 *
 * @return {[type]}    [description]
 */
var getManifest = function(callback) {
    try {
        doRequest('GET', 'https://api.github.com/repos/bitDubai/fermat/contents/FermatManifest.xml', null, function(err_req, res_req) {
            if (err_req) {
                callback(err_req, null);
            } else {
                processRequestBody(res_req, function(err_pro, res_pro) {
                    if (err_pro) {
                        callback(err_pro, null);
                    } else {
                        parseString(res_pro, function(err_par, res_par) {
                            if (err_par) {
                                callback(err_par, null);
                            } else {
                                callback(null, res_par);
                            }
                        });
                    }
                });
            }
        });
    } catch (err) {
        callback(err, null);
    }
};

/**
 * [parseManifest description]
 *
 * @method parseManifest
 *
 * @param  {Function}    callback [description]
 *
 * @return {[type]}      [description]
 */
var parseManifest = function(callback) {
    try {
        getManifest(function(err_man, res_man) {
            if (err_man) callback(err_man, null);
            else {
                var fermat = {};
                var platfrms = [];
                var _platfrms = res_man.fermat.platforms[0].platform;
                for (var i = 0; i < _platfrms.length; i++) {
                    var platfrm = {};
                    platfrm = _platfrms[i]['$'];
                    var layers = [];
                    var _layers = _platfrms[i].layer;
                    for (var j = 0; j < _layers.length; j++) {
                        var layer = {};
                        layer = _layers[j]['$'];
                        var comps = [];
                        if (_layers[j].plugins) {
                            comps = comps.concat(processCompList(platfrm, layer, _layers[j].plugins[0].plugin, 'plugin'));
                        }
                        if (_layers[j].androids) {
                            comps = comps.concat(processCompList(platfrm, layer, _layers[j].androids[0].android, 'android'));
                        }
                        if (_layers[j].addons) {
                            comps = comps.concat(processCompList(platfrm, layer, _layers[j].addons[0].addon, 'addon'));
                        }
                        if (_layers[j].libraries) {
                            comps = comps.concat(processCompList(platfrm, layer, _layers[j].libraries[0].library, 'library'));
                        }
                        layer.comps = comps;
                        layers.push(layer);
                    }
                    platfrm.layers = layers;
                    var depends = [];
                    if (_platfrms[i].dependencies) {
                        var _depends = _platfrms[i].dependencies[0].dependency;
                        for (var j = 0; j < _depends.length; j++) {
                            var depend = {};
                            depend = _depends[j]['$'];
                            depends.push(depend);
                        }
                    }
                    platfrm.depends = depends;
                    platfrms.push(platfrm);
                }
                fermat.platfrms = platfrms;
                var suprlays = [];
                var _suprlays = res_man.fermat.super_layers[0].super_layer;
                for (var i = 0; i < _suprlays.length; i++) {
                    var suprlay = {};
                    suprlay = _suprlays[i]['$'];
                    var layers = [];
                    var _layers = _suprlays[i].layer;
                    for (var j = 0; j < _layers.length; j++) {
                        var layer = {};
                        layer = _layers[j]['$'];
                        var comps = [];
                        if (_layers[j].plugins) {
                            comps = comps.concat(processCompList(suprlay, layer, _layers[j].plugins[0].plugin, 'plugin'));
                        }
                        if (_layers[j].androids) {
                            comps = comps.concat(processCompList(suprlay, layer, _layers[j].androids[0].android, 'android'));
                        }
                        if (_layers[j].addons) {
                            comps = comps.concat(processCompList(suprlay, layer, _layers[j].addons[0].addon, 'addon'));
                        }
                        if (_layers[j].libraries) {
                            comps = comps.concat(processCompList(suprlay, layer, _layers[j].libraries[0].library, 'library'));
                        }
                        layer.comps = comps;
                        layers.push(layer);
                    }
                    suprlay.layers = layers;
                    var depends = [];
                    if (_suprlays[i].dependencies) {
                        var _depends = _suprlays[i].dependencies[0].dependency;
                        for (var j = 0; j < _depends.length; j++) {
                            var depend = {};
                            depend = _depends[j]['$'];
                            depends.push(depend);
                        }
                    }
                    suprlay.depends = depends;
                    suprlays.push(suprlay);
                }
                fermat.suprlays = suprlays;
                callback(null, fermat);
            }
        });
    } catch (err) {
        callback(err, null);
    }
};

/**
 * [saveManifest description]
 *
 * @method saveManifest
 *
 * @param  {Function}   callback [description]
 *
 * @return {[type]}     [description]
 */
var saveManifest = function(callback) {
    try {
        parseManifest(function(err_load, res_load) {
            if (err_load) {
                winston.log('info', err_load.message, err_load);
            } else {
                if (res_load.platfrms && Array.isArray(res_load.platfrms) && res_load.suprlays && Array.isArray(res_load.suprlays)) {
                    var _platfrms = res_load.platfrms;
                    var _suprlays = res_load.suprlays;

                    var loopPlatfrms = function(i) {
                        if (i < _platfrms.length) {
                            var _platfrm = _platfrms[i];
                            platfrmMod.insOrUpdPlatfrm(_platfrm.code.trim().toUpperCase(),
                                _platfrm.name.trim().toLowerCase(),
                                _platfrm.logo,
                                _platfrm.dependsOn ? _platfrm.dependsOn.split(' ').join('').split(',') : [],
                                0,
                                function(err_plat, res_plat) {
                                    if (err_plat) {
                                        winston.log('info', err_plat.message, err_plat);
                                        loopPlatfrms(++i);
                                    } else {
                                        var _layers = _platfrm.layers;

                                        var loopLayers = function(j) {
                                            if (j < _layers.length) {
                                                var _layer = _layers[j];
                                                layerMod.insOrUpdLayer(_layer.name ? _layer.name.trim().toLowerCase() : null,
                                                    _layer.language ? _layer.language.toLowerCase() : null,
                                                    0,
                                                    function(err_lay, res_lay) {
                                                        if (err_lay) {
                                                            winston.log('info', err_lay.message, err_lay);
                                                            loopLayers(++j);
                                                        } else {
                                                            var _comps = _layer.comps;

                                                            var loopComps = function(k) {
                                                                if (k < _comps.length) {
                                                                    var _comp = _comps[k];
                                                                    compMod.insOrUpdComp(res_plat._id,
                                                                        null,
                                                                        res_lay._id,
                                                                        _comp.name.trim().toLowerCase(),
                                                                        _comp.type.trim().toLowerCase(),
                                                                        _comp.description.trim().toLowerCase(),
                                                                        _comp.difficulty,
                                                                        _comp['code-level'].trim().toLowerCase(),
                                                                        _comp.repo_dir,
                                                                        null,
                                                                        function(err_comp, res_comp) {
                                                                            if (err_comp) {
                                                                                winston.log('info', err_comp.message, err_comp);
                                                                                loopComps(++k);
                                                                            } else {
                                                                                var _devs = _comp.devs;
                                                                                var upd_devs = [];
                                                                                var upd_life_cycle = [];

                                                                                var loopDevs = function(l) {
                                                                                    if (l < _devs.length) {
                                                                                        var _dev = _devs[l];
                                                                                        devMod.insOrUpdDev(_dev.name.trim().toLowerCase(), null, null, null, null, null, null, null, function(err_dev, res_dev) {
                                                                                            if (err_dev) {
                                                                                                winston.log('info', err_dev.message, err_dev);
                                                                                                winston.log('info', err_dev.message, _dev);
                                                                                                loopDevs(++l);
                                                                                            } else {
                                                                                                compMod.insOrUpdCompDev(res_comp._id, res_dev._id, _dev.role, _dev.scope, _dev.percentage ? _dev.percentage : '0', function(err_compDev, res_compDev) {
                                                                                                    if (err_compDev) {
                                                                                                        winston.log('info', err_compDev.message, err_compDev);
                                                                                                        loopDevs(++l);
                                                                                                    } else {
                                                                                                        upd_devs.push(res_compDev._id);
                                                                                                        loopDevs(++l);

                                                                                                    }
                                                                                                });
                                                                                            }
                                                                                        });
                                                                                    } else {
                                                                                        var _life_cycle = _comp.life_cycle;

                                                                                        var loopLifeCycle = function(m) {
                                                                                            if (m < _life_cycle.length) {
                                                                                                var _status = _life_cycle[m];
                                                                                                compMod.insOrUpdStatus(res_comp._id, _status.name, _status.target, _status.reached, function(err_sta, res_sta) {
                                                                                                    if (err_sta) {
                                                                                                        winston.log('info', err_sta.message, err_sta);
                                                                                                        loopLifeCycle(++m);
                                                                                                    } else {
                                                                                                        upd_life_cycle.push(res_sta._id);
                                                                                                        loopLifeCycle(++m);
                                                                                                    }
                                                                                                });
                                                                                            } else {
                                                                                                compMod.updCompDevAndLifCyc(res_comp._id, upd_devs, upd_life_cycle, function(err_upd, res_upd) {
                                                                                                    if (err_upd) {
                                                                                                        loopComps(++k);
                                                                                                    } else {
                                                                                                        loopComps(++k);
                                                                                                    }

                                                                                                });
                                                                                            }
                                                                                        };
                                                                                        loopLifeCycle(0);
                                                                                    }
                                                                                };
                                                                                loopDevs(0);
                                                                            }
                                                                        });
                                                                } else {
                                                                    loopLayers(++j);
                                                                }
                                                            };
                                                            loopComps(0);
                                                        }
                                                    });
                                            } else {
                                                loopPlatfrms(++i);
                                            }
                                        };
                                        loopLayers(0);
                                    }
                                });
                        } else {
                            loopSuprlays(0);
                        }
                    };

                    var loopSuprlays = function(n) {
                        if (n < _suprlays.length) {
                            var _suprlay = _suprlays[n];
                            suprlayMod.insOrUpdSuprlay(_suprlay.code.trim().toUpperCase(),
                                _suprlay.name.trim().toLowerCase(),
                                _suprlay.logo,
                                _suprlay.dependsOn ? _suprlay.dependsOn.split(' ').join('').split(',') : [],
                                0,
                                function(err_supr, res_supr) {
                                    if (err_supr) {
                                        winston.log('info', err_supr.message, err_supr);
                                        loopSuprlays(++n);
                                    } else {
                                        var _layers = _suprlay.layers;

                                        var loopLayers = function(o) {
                                            if (o < _layers.length) {
                                                var _layer = _layers[o];
                                                layerMod.insOrUpdLayer(_layer.name ? _layer.name.trim().toLowerCase() : null,
                                                    _layer.language ? _layer.language.toLowerCase() : null,
                                                    0,
                                                    function(err_lay, res_lay) {
                                                        if (err_lay) {
                                                            winston.log('info', err_lay.message, err_lay);
                                                            loopLayers(++o);
                                                        } else {
                                                            var _comps = _layer.comps;

                                                            var loopComps = function(p) {
                                                                if (p < _comps.length) {
                                                                    var _comp = _comps[p];
                                                                    compMod.insOrUpdComp(null,
                                                                        res_supr._id,
                                                                        res_lay._id,
                                                                        _comp.name.trim().toLowerCase(),
                                                                        _comp.type.trim().toLowerCase(),
                                                                        _comp.description.trim().toLowerCase(),
                                                                        _comp.difficulty,
                                                                        _comp['code-level'].trim().toLowerCase(),
                                                                        _comp.repo_dir,
                                                                        null,
                                                                        function(err_comp, res_comp) {
                                                                            if (err_comp) {
                                                                                winston.log('info', err_comp.message, err_comp);
                                                                                loopComps(++p);
                                                                            } else {
                                                                                var _devs = _comp.devs;

                                                                                var loopDevs = function(q) {
                                                                                    if (q < _devs.length) {
                                                                                        var _dev = _devs[q];
                                                                                        devMod.insOrUpdDev(_dev.name.trim().toLowerCase(), null, null, null, null, null, null, null, function(err_dev, res_dev) {
                                                                                            if (err_dev) {
                                                                                                winston.log('info', err_dev.message, err_dev);
                                                                                                winston.log('info', err_dev.message, _dev);
                                                                                                loopDevs(++q);
                                                                                            } else {
                                                                                                compMod.insOrUpdCompDev(res_comp._id, res_dev._id, _dev.role, _dev.scope, _dev.percentage ? _dev.percentage : '0', function(err_compDev, res_compDev) {
                                                                                                    if (err_compDev) {
                                                                                                        winston.log('info', err_compDev.message, err_compDev);
                                                                                                        loopDevs(++q);
                                                                                                    } else {
                                                                                                        var _life_cycle = _comp.life_cycle;

                                                                                                        var loopLifeCycle = function(r) {
                                                                                                            if (r < _life_cycle.length) {
                                                                                                                var _status = _life_cycle[r];
                                                                                                                compMod.insOrUpdStatus(res_comp._id, _status.name, _status.target, _status.reached, function(err_sta, res_sta) {
                                                                                                                    if (err_sta) {
                                                                                                                        winston.log('info', err_sta.message, err_sta);
                                                                                                                        loopLifeCycle(++r);
                                                                                                                    } else {
                                                                                                                        loopLifeCycle(++r);
                                                                                                                    }
                                                                                                                });
                                                                                                            } else {
                                                                                                                loopDevs(++q);
                                                                                                            }
                                                                                                        };
                                                                                                        loopLifeCycle(0);
                                                                                                    }
                                                                                                });
                                                                                            }
                                                                                        });
                                                                                    } else {
                                                                                        loopComps(++p);
                                                                                    }
                                                                                };
                                                                                loopDevs(0);
                                                                            }
                                                                        });
                                                                } else {
                                                                    loopLayers(++o);
                                                                }
                                                            };
                                                            loopComps(0);
                                                        }
                                                    });
                                            } else {
                                                loopSuprlays(++n);
                                            }
                                        };
                                        loopLayers(0);
                                    }
                                });
                        } else {
                            winston.log('info', 'done loading components');
                        }
                    };
                    callback(null, {
                        'save': true
                    });
                    loopPlatfrms(0);
                } else {
                    callback(null, {
                        'save': false
                    });
                }
            }
        });
    } catch (err) {
        callback(err, null);
    }
};

/**
 * [getUser description]
 *
 * @method getUser
 *
 * @param  {[type]}   usrnm    [description]
 * @param  {Function} callback [description]
 *
 * @return {[type]}   [description]
 */
var getUser = function(usrnm, callback) {
    try {
        doRequest('GET', 'https://api.github.com/users/' + usrnm, null, function(err_req, res_req) {
            if (err_req) {
                callback(err_req, null);
            } else {
                processRequestBody(res_req, function(err_pro, res_pro) {
                    if (err_pro) {
                        callback(err_pro, null);
                    } else {
                        callback(null, res_pro);
                    }
                });
            }
        });
    } catch (err) {
        callback(err, null);
    }
};

/**
 * [updateDevs description]
 *
 * @method updateDevs
 *
 * @param  {Function} callback [description]
 *
 * @return {[type]}   [description]
 */
var updateDevs = function(callback) {
    devMod.getDevs(function(err_devs, res_devs) {
        if (err_devs) {
            callback(err_devs, null);
        } else if (res_devs && Array.isArray(res_devs)) {
            callback(null, {
                'update': true
            });

            var loopDevs = function(i) {
                if (i < res_devs.length) {
                    var _dev = res_devs[i];
                    getUser(_dev.usrnm, function(err_usr, res_usr) {
                        if (err_usr) {
                            winston.log('info', err_usr.message, err_usr);
                            loopDevs(++i);
                        } else if (res_usr) {
                            devMod.insOrUpdDev(_dev.usrnm,
                                res_usr.email ? res_usr.email : null,
                                res_usr.name ? res_usr.name : null,
                                null,
                                res_usr.location ? res_usr.location : null,
                                res_usr.avatar_url ? res_usr.avatar_url : null,
                                res_usr.html_url ? res_usr.html_url : null,
                                res_usr.bio ? res_usr.bio : null,
                                function(err_upd, res_upd) {
                                    if (err_upd) {
                                        winston.log('info', err_upd.message, err_upd);
                                    }
                                });
                        }
                    });
                    loopDevs(++i);
                }
            };
            loopDevs(0);
        } else {
            callback(new Error('no developers to iterate'), null);
        }
    });
};

/**
 * [getContent description]
 *
 * @method getContent
 *
 * @param  {[type]}   repo_dir [description]
 * @param  {Function} callback [description]
 *
 * @return {[type]}   [description]
 */
var getContent = function(repo_dir, callback) {
    try {
        doRequest('GET', 'https://api.github.com/repos/bitDubai/fermat/contents/' + repo_dir, null, function(err_req, res_req) {
            if (err_req) {
                callback(err_req, null);
            } else {
                processRequestBody(res_req, function(err_pro, res_pro) {
                    if (err_pro) {
                        callback(err_pro, null);
                    } else {
                        callback(null, res_pro);
                    }
                });
            }
        });
    } catch (err) {
        callback(err, null);
    }
};

/**
 * [updateComps description]
 *
 * @method updateComps
 *
 * @param  {Function}  callback [description]
 *
 * @return {[type]}    [description]
 */
var updateComps = function(callback) {
    compMod.findComps(function(err_comps, res_comps) {
        if (err_comps) {
            callback(err_comps, null);
        } else if (res_comps && Array.isArray(res_comps)) {
            callback(null, {
                'update': true
            });
            var upd_cont = 0;

            var loopComps = function(i) {
                if (i < res_comps.length) {
                    var _comp = res_comps[i];
                    if (_comp.code_level != 'concept') {
                        getContent(_comp.repo_dir, function(err_dir, res_dir) {
                            if (err_dir) {
                                winston.log('info', err_dir.message, err_dir);
                            } else {
                                if (res_dir && Array.isArray(res_dir)) {
                                    compMod.insOrUpdComp(_comp._platfrm_id, _comp._suprlay_id, _comp._layer_id, _comp.name, null, null, null, null, null, true,
                                        function(err_upd, res_upd) {
                                            if (err_upd) {
                                                winston.log('info', err_upd.message, err_upd);
                                            } else {
                                                winston.log('info', 'updating %s...', _comp._id + '');
                                            }
                                        });
                                }
                            }
                        });
                    }
                    loopComps(++i);
                } else {
                    winston.log('info', 'done iterating components');
                }
            };
            loopComps(0);
        } else {
            callback(new Error('no developers to iterate'), null);
        }
    });
};

/**
 * [updComps description]
 *
 * @method updComps
 *
 * @param  {Function} callback [description]
 *
 * @return {[type]}   [description]
 */
exports.updComps = function(callback) {
    updateComps(function(err, res) {
        if (err) callback(err, null);
        else if (res) callback(null, res);
        else callback(null, null);
    });
};

/**
 * [updDevs description]
 *
 * @method updDevs
 *
 * @param  {Function} callback [description]
 *
 * @return {[type]}   [description]
 */
exports.updDevs = function(callback) {
    updateDevs(function(err, res) {
        if (err) callback(err, null);
        else if (res) callback(null, res);
        else callback(null, null);
    });
};

/**
 * [loadComps description]
 *
 * @method loadComps
 *
 * @param  {Function} callback [description]
 *
 * @return {[type]}   [description]
 */
exports.loadComps = function(callback) {
    saveManifest(function(err, res) {
        if (err) callback(err, null);
        else if (res) callback(null, res);
        else callback(null, null);
    });
};
/*jshint +W069 */