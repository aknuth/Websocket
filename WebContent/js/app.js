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
	var fs = require('fs');

	const dialog = require('electron').remote.dialog;
	const app = require('electron').remote.app;
  //const actualdir = require('electron').remote.getGlobal("__dirname");

	var socket;
	var s = '';
	var initialWidth = 0;
	var initialHeight = 0;
	var initialTime = 0;

	function connect() {
		var host = "ws://localhost:" + $('#portnumber').val();

		try {
			socket = new WebSocket(host);

			socket.onopen = function() {
				if (socket.readyState === 1) {
					if (localStorage.getItem('path')){
						switchButton('#_record',State.ENABLED);
						switchButton('#_play',State.ENABLED);
						var p = localStorage.getItem('path');
						var msg = {"action":"set_path","dir":p};
						socket.send(JSON.stringify(msg));
					}
			        var msg = {"action":"guipath","dir":`${__dirname}`}; 
			        socket.send(JSON.stringify(msg)); 
					switchButton('#_path',State.ENABLED);
					switchButton('#_connect',State.STAY,Color.GREEN,"Disconnect",'connected');
				}
			}

			socket.onmessage = function(msg) {
				var json = JSON.parse(msg.data);
				if (json.callback === 'play' && json.state === 'finished' ){
					switchButton('#_play',State.ENABLED,Color.WHITE);
					switchButton('#_record',State.ENABLED);
				} else if (json.action){
					if (json.action.type==='resize'){
						initialWidth = parseInt(json.action.width);
						initialHeight = parseInt(json.action.height);
						initialTime = parseInt(json.action.time);
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
				}
				message('<p class="message">Received: ' + msg.data);
			}

			socket.onclose = function() {
				if (socket.readyState === 3) {
					switchButton('#_path',State.DISABLED);
					switchButton('#_connect',State.STAY,Color.WHITE,'Connect','disconnected');
					switchButton('#_play',State.DISABLED,Color.WHITE);
					switchButton('#_record',State.DISABLED,Color.WHITE,'Record','');
					switchButton('#_pause', State.DISABLED,Color.WHITE, 'Pause', '');
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

	$('#connect').click(function() {
		$('#portModal').modal('hide');
		connect();
	});

	$('#_connect').click(function() {
			if ($('#_connect').attr('name') == 'disconnected') {
				$('#portnumber').val('8000');
				$('#portModal').modal('show');
			} else {
				socket.close();
			}
	})

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
					$('#chatLog').empty();
					switchButton('#_pause',State.DISABLED);
					switchButton('#_record',State.STAY,Color.WHITE,'Record','');
					switchButton('#_play',State.ENABLED);
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
		socket.send(JSON.stringify(msg));
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
		$('#pathModal').modal('show');
	})

	$('#path').click(function() {
		$('#pathModal').modal('hide');
		var p = $('#defaultpath').val();
		var msg = {"action":"set_path","dir":p};
		socket.send(JSON.stringify(msg));
		
		var ua = $('#useragent').val();
		var msg = {"user-agent":ua};
		socket.send(JSON.stringify(msg));

		localStorage.setItem('path', $('#defaultpath').val());
		localStorage.setItem('useragent', $('#useragent').val());
		
		switchButton('#_record',State.ENABLED);
		switchButton('#_play',State.ENABLED);
	})

	$('#_play').click(function() {
		dialog.showOpenDialog({title: 'Open JSON for Play',filters: [{name: 'JSON', extensions: ['json']}]},function (fileName) {
			if (fileName === undefined) return;
			var msg = {"action":"play","json":fileName[0]}
			socket.send(JSON.stringify(msg));
			switchButton('#_play',State.STAY,Color.BLUE);
			switchButton('#_play',State.ENABLED);
			switchButton('#_record',State.DISABLED);
		});
	})

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


});
