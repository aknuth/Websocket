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
Color.STAY = new Color('STAY');

$(document).ready(function() {
	var fs = require('fs');

	const dialog = require('electron').remote.dialog;
	const app = require('electron').remote.app;

	var socket;
	var s = '';



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
					switchButton('#_path',State.ENABLED);
					switchButton('#_connect',State.STAY,Color.GREEN,"Disconnect",'connected');
				}
			}

			socket.onmessage = function(msg) {
				var json = JSON.parse(msg.data);
				if (json.callback === 'play' && json.state === 'finished' ){
					switchButton('#_play',State.ENABLED,Color.WHITE);
					switchButton('#_record',State.ENABLED);
					$('#file').val('');
				} else if (json.action){
					console.log(msg.data);
					s = s + S(msg.data).between('{"action":', '}}').s + '},';
				} else if (json.event.type=='init'){
					s = '{"start_time":';
					s = s + json.event.start_time;
					s = s + ',"start_url":"';
					s = s + json.event.start_url;
					s = s + '","actions":[';
				}
				message('<p class="message">Received: ' + msg.data);
			}

			socket.onclose = function() {
				if (socket.readyState === 3) {
					//$('#_path').attr('disabled',true);
					switchButton('#_path',State.DISABLED);
					switchButton('#_connect',State.STAY,Color.WHITE,'Connect','disconnected');
					switchButton('#_play',State.DISABLED,Color.WHITE);
					switchButton('#_record',State.DISABLED,Color.WHITE,'Record','');

					$('#file').val('');

			}
			}

		} catch (exception) {
			message('<p>Error' + exception);
		}

	}

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
				var msg = {"action":"record","state":"finished"};
				socket.send(JSON.stringify(msg));
				s = s.substring(0,s.length-1) + ']}';
				dialog.showSaveDialog({title: 'Save as JSON',filters: [{name: 'JSON', extensions: ['json']}]},function (fileName) {
    			if (fileName === undefined) return;
    			fs.writeFile(fileName, s, function (err) {
    			});
					s="";
					$('#chatLog').empty();
  			});
				switchButton('#_record',State.STAY,Color.WHITE,'Record','');
				switchButton('#_play',State.ENABLED);
			} else {
				if (localStorage.getItem('url')){
						$('#url').val(localStorage.getItem('url'));
				}
				$('#recordModal').modal('show');
			}
	})

	$('#record').click(function() {
		$('#recordModal').modal('hide');
		localStorage.setItem('url',$('#url').val())
		var msg = {"action":"record","state":"begin","url":$('#url').val()};
		socket.send(JSON.stringify(msg));
		switchButton('#_record',State.STAY,Color.RED,'Stop Record','recording');
		switchButton('#_play',State.DISABLED);
	})

	$('#_path').click(function() {
		if (localStorage.getItem('path')){
			$('#defaultpath').val(localStorage.getItem('path'));
		} else {
			$('#defaultpath').val(app.getPath('appData'));
		}
		$('#pathModal').modal('show');
	})

	$('#path').click(function() {
		$('#pathModal').modal('hide');
		var p = $('#defaultpath').val()
		var msg = {"action":"set_path","dir":p};
		socket.send(JSON.stringify(msg));
		localStorage.setItem('path', $('#defaultpath').val());
		switchButton('#_record',State.ENABLED);
		switchButton('#_play',State.ENABLED);
	})

	$('#_play').click(function() {
		//var input = $('#file');
		//console.log(input.val().replace(/\\/g, '/').replace(/.*\//, ''));
		dialog.showOpenDialog({title: 'Open JSON for Play',filters: [{name: 'JSON', extensions: ['json']}]},function (fileName) {
			if (fileName === undefined) return;
			//var p = localStorage.getItem('path')+"\\"+label;
			var msg = {"action":"play","json":fileName[0]}
			socket.send(JSON.stringify(msg));
			switchButton('#_play',State.STAY,Color.BLUE);
			switchButton('#_play',State.ENABLED);
			switchButton('#_record',State.DISABLED);
		});
	})

/**	$(document).on('change', ':file', function() {
    var input = $(this),
        numFiles = input.get(0).files ? input.get(0).files.length : 1,
        label = input.val().replace(/\\/g, '/').replace(/.*\//, '');
    input.trigger('fileselect', [numFiles, label]);
  });
	$(':file').on('fileselect', function(event, numFiles, label) {
		var p = localStorage.getItem('path')+"\\"+label;
		var msg = {"action":"play","json":p}
		socket.send(JSON.stringify(msg));
		switchButton('#_record',State.STAY,Color.BLUE);
		switchButton('#_record',State.ENABLED);
	});
*/

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
