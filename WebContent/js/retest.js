'use strict';

class Color {
        constructor(name) {
            this.name = name;
        }
        toString() {
            return `Color.${this.name}`;
        }
}
class State {
        constructor(name) {
            this.name = name;
        }
        toString() {
            return `Color.${this.name}`;
        }
}

State.ENABLED = new State('ENABLED');
State.DISABLED = new State('DISABLED');
State.STAY = new State('STAY');

Color.RED = new Color('RED');
Color.GREEN = new Color('GREEN');
Color.BLUE = new Color('BLUE');
Color.WHITE = new Color('WHITE');
Color.ORANGE = new Color('ORANGE');
Color.LIGHTBLUE = new Color('LIGHTBLUE');
Color.STAY = new Color('STAY');

$(document).ready(function() {
	const fs = require('fs');

	const dialog = require('electron').remote.dialog;
	const app = require('electron').remote.app;
	const {ipcRenderer} = require('electron');
	const moment = require('moment');
  //const actualdir = require('electron').remote.getGlobal("__dirname");

	var socket;
	var s = '';
	var eventanzeige = '';
	var zeitanzeige = '';

	var movebuffer = '';
	var typebuffer = '';
	var zeitbuffer = 0;
	var zeitbuffertype = 0;

	var initialWidth = 0;
	var initialHeight = 0;
	var initialTime = 0;
	let child; 

	if (localStorage.getItem('path') && localStorage.getItem('exepath')){
		switchButton('#_record',State.ENABLED);
		switchButton('#_play',State.ENABLED);
	} else {
		switchButton('#_record',State.DISABLED);
		switchButton('#_play',State.DISABLED);
	}	
	function connect(json) {
		//var host = "ws://localhost:" + $('#portnumber').val();
		var host = "ws://localhost:8000";
		try {
			socket = new WebSocket(host);

			socket.onopen = function() {
				if (socket.readyState === 1) {
					if (localStorage.getItem('path')){
						var p = localStorage.getItem('path');
						var msg = {"action":"set_path","dir":p};
						socket.send(JSON.stringify(msg));
					}
					if (localStorage.getItem('useragent')){
						var ua = localStorage.getItem('useragent');
						var msg = {"user-agent":ua};
						socket.send(JSON.stringify(msg));
					}
					socket.send(json);
					switchButton('#_connect',State.STAY,Color.GREEN,"Disconnect",'connected');
				}
			}

			socket.onmessage = function(msg) {
				var json = JSON.parse(msg.data);
				if (json.callback === 'play' && json.state === 'finished' ){
					switchButton('#_play',State.ENABLED,Color.WHITE);
					switchButton('#_record',State.ENABLED);
					child.kill('SIGTERM');
				} else if (json.action){
					if (json.action.type==='resize'){
						initialWidth = parseInt(json.action.width);
						initialHeight = parseInt(json.action.height);
						initialTime = parseInt(json.action.time);
						eventanzeige = 'Resize: '+initialWidth+' x '+initialHeight;
						zeitanzeige = initialTime;
					} else if (json.action.type==='click' && json.action.wp===513){
						eventanzeige = 'Click - X:'+json.action.x+' - Y:'+json.action.y;
						zeitanzeige = json.action.time;
					} else if (json.action.type==='type' && json.action.ch>0){
						typebuffer = typebuffer + String.fromCharCode(json.action.ch).charAt(0);
						zeitbuffertype = zeitbuffertype + json.action.time;
					} else if (json.action.type==='move'){
						movebuffer = "Move";
						zeitbuffer = zeitbuffer + json.action.time;
					}
					s = s + S(msg.data).between('{"action":', '}}').s + '},';
				} else if (json.event && (json.event.type=='screenshot' || json.event.type=='domtree')){
					switchButton('#_dom',State.STAY,Color.WHITE);
					switchButton('#_screenshot',State.STAY,Color.WHITE);
				} else if (json.event && json.event.type=='init'){
					s = '{"start_time":';
					s = s + json.event.start_time;
					s = s + ',"start_url":"';
					s = s + json.event.start_url;
					s = s + '","actions":['+'{"type":"resize","width":'+initialWidth+',"height":'+initialHeight+',"time":'+initialTime+'},';
					eventanzeige='Start URL: '+json.event.start_url;
					zeitanzeige='Start URL: '+json.event.start_time;
				}
				if (eventanzeige!=''){
					if (movebuffer!=''){
						t.row.add( [
							movebuffer,
							zeitbuffer.toString()
						] ).draw( false );
						movebuffer='';
						zeitbuffer=0;
					}
					if (typebuffer!=''){
						t.row.add( [
							typebuffer,
							zeitbuffertype.toString()
						] ).draw( false );
						typebuffer='';
						zeitbuffertype=0;
					}
					t.row.add( [
						eventanzeige,
						zeitanzeige
					] ).draw( false );
					eventanzeige='';
					zeitanzeige='';
				}
			}

			socket.onclose = function() {
				if (socket.readyState === 3) {
					//switchButton('#_path',State.DISABLED);
					//switchButton('#_connect',State.STAY,Color.WHITE,'Connect','disconnected');
					//switchButton('#_play',State.DISABLED,Color.WHITE);
					//switchButton('#_record',State.DISABLED,Color.WHITE,'Record','');
					//switchButton('#_pause', State.DISABLED,Color.WHITE, 'Pause', '');
				}
			}

		} catch (exception) {
			message('<p>Error' + exception);
		}

	}
	$(".btn").mouseup(function(){
	    $(this).blur();
	})
	function message(msg) {
		$('#chatLog').append(msg + '</p>');
	}

	$('#_record').click(function() {
			if ($('#_record').attr('name') == 'recording') {
				dialog.showSaveDialog({title: 'Save as JSON',filters: [{name: 'JSON', extensions: ['json']}]},function (fileName) {
					var msg = {"action":"record","state":"finished"};
					socket.send(JSON.stringify(msg));
					s = s.substring(0,s.length-1) + ']}';
					if (fileName != undefined){
						fs.writeFile(fileName, s, function (err) {});
					}
					s="";
					switchButton('#_pause',State.DISABLED);
					switchButton('#_record',State.ENABLED,Color.WHITE,'Record','');
					switchButton('#_play',State.ENABLED);
					socket.close();
					child.kill('SIGTERM');
				});
			} else {
				if (localStorage.getItem('url')){
					$('#url').val(localStorage.getItem('url'));
					$('#width').val(localStorage.getItem('width'));
					$('#height').val(localStorage.getItem('height'));
				}
				$('#recordModal').modal('show');
				switchButton('#_pause',State.ENABLED);
			}
	})

	$('#record').click(function() {
		$('#recordModal').modal('hide');
		localStorage.setItem('url',$('#url').val())
		var width = parseInt($('#width').val());
		var height = parseInt($('#height').val());
		if (width && height){
			localStorage.setItem('width',width);
			localStorage.setItem('height',height);
			var msg = {"action":"record","state":"begin","url":$('#url').val(),"width":width,"height":height};
		} else {
			var msg = {"action":"record","state":"begin","url":$('#url').val()};
		}
		const execFile = require('child_process').execFile;
		child = execFile(localStorage.getItem('exepath')+'/WebEventBrowser.exe', ['--url=about:blank'], (error, stdout, stderr) => {
		  if (error) {
			console.log(error);
		  }
		  console.log(stdout);
		});
		connect(JSON.stringify(msg));
		switchButton('#_record',State.STAY,Color.RED,'Stop Record','recording');
		switchButton('#_play',State.DISABLED);
		switchButton('#_pause',State.ENABLED);
	})

	$('#_path').click(function() {
		if (localStorage.getItem('path')){
			$('#defaultpath').val(localStorage.getItem('path'));
		} else {
			$('#defaultpath').val(app.getPath('appData'));
		}
		if (localStorage.getItem('useragent')){
			$('#useragent').val(localStorage.getItem('useragent'));
		}
		if (localStorage.getItem('exepath')){
			$('#exepath').val(localStorage.getItem('exepath'));
		}
		$('#pathModal').modal('show');
	})

	$('#path').click(function() {
		$('#pathModal').modal('hide');
		var p = $('#defaultpath').val();
		var msg = {"action":"set_path","dir":p};
		
		var ua = $('#useragent').val();
		var msg = {"user-agent":ua};

		localStorage.setItem('path', $('#defaultpath').val());
		localStorage.setItem('useragent', $('#useragent').val());
		let epath = $('#exepath').val();
		epath = S(epath).replaceAll('\\', '/');
		localStorage.setItem('exepath', S(epath).ensureRight('/'));

		if (localStorage.getItem('path') && localStorage.getItem('exepath')){
			switchButton('#_record',State.ENABLED);
			switchButton('#_play',State.ENABLED);
		} else {
			switchButton('#_record',State.DISABLED);
			switchButton('#_play',State.DISABLED);
		}	
	})

	$('#_play').click(function() {
		dialog.showOpenDialog({title: 'Open JSON for Play',filters: [{name: 'JSON', extensions: ['json']}]},function (fileName) {
			if (fileName === undefined) return;
			var msg = {"action":"play","json":fileName[0]}
			const execFile = require('child_process').execFile;
			child = execFile(localStorage.getItem('exepath')+'WebEventBrowser.exe', ['--url=about:blank'], (error, stdout, stderr) => {
			  if (error) {
				console.log(error);
			  }
			  console.log(stdout);
			});
			connect(JSON.stringify(msg));			
			switchButton('#_play',State.STAY,Color.BLUE);
			switchButton('#_play',State.ENABLED);
			switchButton('#_record',State.DISABLED);
		});
	})

	$('#play').click(function() {
		dialog.showOpenDialog({title: 'Open JSON for Play',filters: [{name: 'JSON', extensions: ['json']}]},function (fileName) {
			if (fileName === undefined) return;
			var msg = {"action":"play","json":fileName[0]}
			var json = require(fileName[0]);
			//var wp = window.open(json.start_url);
			
			ipcRenderer.send('start',json.start_url);
			var p = Promise.resolve();
			var i = 0;
			for (let value of json.actions){
				let all = json.actions.length;
				let j = i++;
				p = p.then(() => doTheWork(value,all,j));				
			}
			//switchButton('#_play',State.STAY,Color.BLUE);
			//switchButton('#_play',State.ENABLED);
			//switchButton('#_record',State.DISABLED);
		});
	})
	
	function doTheWork(json,n,i){
		return new Promise(function(resolve,reject){
			setTimeout(()=>{
				if (json.type==='resize'){
					console.log(i+' von'+n+' -> '+moment().format("HH:mm:ss-SSS")+':'+json.type+' - '+json.time);
					ipcRenderer.send('resize',json.width,json.height);
				} else if (json.type==='click' && json.wp===513){
					console.log(i+' von'+n+' -> '+moment().format("HH:mm:ss-SSS")+':'+json.type+' - '+json.time);
					ipcRenderer.send('click',json.x,json.y);
				} else if (json.type==='type' && json.ch>0){
					console.log(i+' von'+n+' -> '+moment().format("HH:mm:ss-SSS")+':'+json.type+' - '+json.time);
					ipcRenderer.send('type',json.ch);
				} else if (json.type==='wheel'){
					console.log(i+' von'+n+' -> '+moment().format("HH:mm:ss-SSS")+':'+json.type+' - '+json.time);
					ipcRenderer.send('wheel',json.x,json.y,json.delta);
				} else if (json.type==='move'){
					console.log(i+' von'+n+' -> '+moment().format("HH:mm:ss-SSS")+':'+json.type+' - '+json.time);
					ipcRenderer.send('move',json.x,json.y);
				}
				if (i+1===n){
					console.log(i+' von'+n+' -> '+moment().format("HH:mm:ss-SSS")+':close');
					ipcRenderer.send('close');
				}
				resolve();
			},json.time)
		});
	}
	
	$('#_pause').click(function() {
		if ($('#_pause').attr('name') == 'pause') {
			var msg = {"action":"resume"};
			socket.send(JSON.stringify(msg));
			switchButton('#_pause',State.STAY,Color.WHITE,'Pause','');
			switchButton('#_record',State.ENABLED);
			switchButton('#screenshot',State.DISABLED);
			switchButton('#dom',State.DISABLED);
		} else {
			var msg = {"action":"pause"};
			socket.send(JSON.stringify(msg));
			switchButton('#_pause',State.STAY,Color.ORANGE,'Resume','pause');
			switchButton('#_record',State.DISABLED);
			switchButton('#screenshot',State.ENABLED);
			switchButton('#dom',State.ENABLED);
		}
	})

	$('#_screenshot').click(function() {
		var msg = {"action":"screenshot"};
		socket.send(JSON.stringify(msg));
		switchButton('#screenshot',State.STAY,Color.LIGHTBLUE);
	})
  $('#_screenshot_size').click(function() {
		var msg = {"action":"screenshot","x":0,"y":0,"width":800,"height":600};
		socket.send(JSON.stringify(msg));
		switchButton('#screenshot',State.STAY,Color.LIGHTBLUE);
	})

	$('#_dom').click(function() {
		var msg = {"action":"domtree"};
		socket.send(JSON.stringify(msg));
		switchButton('#dom',State.STAY,Color.LIGHTBLUE);
	})
  $('#_javascript').click(function() {
    var ff = __dirname+'\\js\\examineTree_fix.js';
    var msg = {"action":"domtree","javascript":ff};
		socket.send(JSON.stringify(msg));
		switchButton('#dom',State.STAY,Color.LIGHTBLUE);
	})

	$.fn.removeClassPrefix = function(prefix){
	    var c, regex = new RegExp("(^|\\s)" + prefix + "\\S+", 'g');
	    return this.each(function(){
	        c = this.getAttribute('class');
	        this.setAttribute('class', c.replace(regex, ''));
	    });
	};

	function switchButton(id,state,color,newtext,nameAttribute){
		if (state === State.ENABLED){
			$(id).removeAttr('disabled');
		} else if (state === State.DISABLED){
			$(id).attr('disabled',true);
		}
		if (color === Color.WHITE){
			$(id).removeClassPrefix('btn-');
			$(id).addClass('btn-secondary');
		} else if (color === Color.RED){
			$(id).removeClassPrefix('btn-');
			$(id).addClass('btn-danger');
		} else if (color === Color.BLUE){
			$(id).removeClassPrefix('btn-');
			$(id).addClass('btn-primary');
		} else if (color === Color.GREEN){
			$(id).removeClassPrefix('btn-');
			$(id).addClass('btn-success');
		} else if (color === Color.ORANGE){
			$(id).removeClassPrefix('btn-');
			$(id).addClass('btn-warning');
		} else if (color === Color.LIGHTBLUE){
			$(id).removeClassPrefix('btn-');
			$(id).addClass('btn-info');
		}
		if (newtext){
			$(id).text(newtext);
		}
		if (nameAttribute){
			$(id).removeAttr('name');
			$(id).attr('name',nameAttribute);
		} else if (nameAttribute === ''){
			$(id).removeAttr('name');
		}
	}

    var t = $('#example').DataTable({
			 "info": false,
			 paging: false,
			 searching: false,
			 ordering:  false,
			 scrollY: '50vh',
        	 scrollCollapse: true
	});
	

});
