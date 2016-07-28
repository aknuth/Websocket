$(document).ready(function() {

	var socket;
	function connect() {
		var host = "ws://localhost:" + $('#portnumber').val();

		try {
			socket = new WebSocket(host);

			message('<p class="event">Socket Status: ' + socket.readyState);

			socket.onopen = function() {
				message('<p class="event">Socket Status: ' + socket.readyState + ' (open)');
				if (socket.readyState === 1) {
					if (localStorage.getItem('path')){
						$('#_record').removeAttr('disabled');
						$('#_play').removeClass('disabled');
					}
					$('#_path').removeAttr('disabled');
					$('#_connect').removeClass('btn-secondary');
					$('#_connect').addClass('btn-success');
					$('#_connect').text("Disconnect");
					$('#_connect').attr('name', 'connected');
				}
			}

			socket.onmessage = function(msg) {
				var json = JSON.parse(msg.data);
				if (json.callback === 'play' && json.state === 'finished' ){
					$('#_play').removeClass('disabled');
					$('#_play').addClass('btn-secondary');
					$('#_play').removeClass('btn-primary');
					$('#_record').removeAttr('disabled');
					$('#file').val('');
				}
				message('<p class="message">Received: ' + msg.data);
			}

			socket.onclose = function() {
				message('<p class="event">Socket Status: ' + socket.readyState + ' (Closed)');
				if (socket.readyState === 3) {
					$('#_path').attr('disabled',true);
					$('#_path').add('disabled',true);
					$('#_connect').addClass('btn-secondary');
					$('#_connect').removeClass('btn-success');
					$('#_connect').text("Connect");
					$('#_connect').attr('name', 'disconnected');

					$('#_play').addClass('disabled');
					$('#_play').removeClass('btn-primary');
					$('#_play').addClass('btn-secondary');
					$('#file').val('');

					$('#_record').attr('disabled',true);
					$('#_record').removeClass('btn-danger');
					$('#_record').addClass('btn-secondary');
					$('#_record').text("Record");
					$('#_record').removeAttr('name');

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
				$('#portModal').modal('show');
			} else {
				socket.close();
			}
	})

	$('#_record').click(function() {
			if ($('#_record').attr('name') == 'recording') {
				$('#_record').removeClass('btn-danger');
				$('#_record').addClass('btn-secondary');
				$('#_record').text("Record");
				$('#_record').removeAttr('name');
				$('#_play').removeClass('disabled');
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
		var msg = {"action":"record","url":$('#url').val()};
		socket.send(JSON.stringify(msg));
		$('#_record').addClass('btn-danger');
		$('#_record').removeClass('btn-secondary');
		$('#_record').text("Stop Record");
		$('#_record').attr('name', 'recording');
		$('#_play').addClass('disabled');
	})

	$('#_path').click(function() {
		if (localStorage.getItem('path')){
			$('#defaultpath').val(localStorage.getItem('path'));
		}
		$('#pathModal').modal('show');
	})

	$('#path').click(function() {
		$('#pathModal').modal('hide');
		localStorage.setItem('path', $('#defaultpath').val());
		$('#_record').removeAttr('disabled');
		$('#_play').removeClass('disabled');
	})

	$('#_play').click(function() {
		var input = $('#file');
		console.log(input.val().replace(/\\/g, '/').replace(/.*\//, ''));
	})

	$(document).on('change', ':file', function() {
    var input = $(this),
        numFiles = input.get(0).files ? input.get(0).files.length : 1,
        label = input.val().replace(/\\/g, '/').replace(/.*\//, '');
    input.trigger('fileselect', [numFiles, label]);
  });
	$(':file').on('fileselect', function(event, numFiles, label) {
		var p = localStorage.getItem('path')+"\\"+label;
		var msg = {"action":"play","json":p}
		socket.send(JSON.stringify(msg));
		$('#_play').removeClass('btn-secondary');
		$('#_play').addClass('btn-primary');
		$('#_play').addClass('disabled');
		$('#_record').attr('disabled',true);
	});


});
