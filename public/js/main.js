(function ($) {

	"use strict";

	var fullHeight = function () {

		$('.js-fullheight').css('height', $(window).height());
		$(window).resize(function () {
			$('.js-fullheight').css('height', $(window).height());
		});

	};
	fullHeight();

	$('#sidebarCollapse').on('click', function () {
		$('#sidebar').toggleClass('active');
	});

})(jQuery);


// ------------------------ Start Dynamic Chat App Script ------------------------

function getCookie(name) {
	let matches = document.cookie.match(new RegExp(
		"(?:^|; )" + name.replace(/([\.$?*|{}\(\)\[\]\\\/\+^])/g, '\\$1') + "=([^;]*)"
	));
	return matches ? decodeURIComponent(matches[1]) : undefined;
}

let userData = JSON.parse(getCookie('user'));

let sender_id = userData._id;
let receiver_id;

let socket = io('/user-namespace', {
	auth: {
		token: userData._id,
	}
});

$(document).ready(function () {
	$('.chat-section').hide(); // Hide initially

	$('.user-list').click(function () {
		receiver_id = $(this).attr('data-id');
		$('.start-head').hide();
		$('.chat-section').show();

		socket.emit('existsChat', {
			sender_id: sender_id,
			receiver_id: receiver_id
		})
	});

	// Handle form submit
	$('#chat-form').submit(function (e) {
		e.preventDefault();

		let message = $('#message').val();

		$.ajax({
			url: '/save-chat',
			type: 'POST',
			data: {
				sender_id: sender_id,
				receiver_id: receiver_id,
				message: message
			},
			success: function (response) {
				if (response.success) {
					$('#message').val('');
					let chat = response.data.message;
					let html = `
                            <div class="current-user-chat" id='`+ response.data._id + `'>
                                <h5><span>`+ chat + `</span>
                                    <i class="fa fa-trash" aria-hidden="true" data-id='` + response.data._id + `' data-bs-toggle="modal" data-bs-target="#deleteChatModal"></i>
                                    <i class="fa fa-edit" aria-hidden="true" data-id='` + response.data._id + `' data-msg='` + chat + `' data-bs-toggle="modal" data-bs-target="#editChatModal"></i>
                                </h5>
                            </div>
                            `;
					$('#chat-container').append(html); // Fixed selector
					socket.emit('newChat', response.data);

					scrollChat(); // Scroll to the bottom after sending a message
				} else {
					alert(response.msg);
				}
			}
		});
	});

	socket.on('loadNewChat', function (data) {
		if (sender_id == data.receiver_id && receiver_id == data.sender_id) {
			let html = `
                    <div class="distance-user-chat" id='` + data._id + `'>
                        <h5>${data.message}</h5>
                    </div>
                    `;
			$('#chat-container').append(html);
		}

		scrollChat(); // Scroll to the bottom after receiving a new chat
	});

	// Load old chats
	socket.on('loadChats', function (data) {
		$('#chat-container').html(''); // Clear previous chats

		let chats = data.chats;

		let html = '';

		for (let x = 0; x < chats.length; x++) {

			let addClass = '';

			if (chats[x]['sender_id'] == sender_id) {
				addClass = 'current-user-chat';
			} else {
				addClass = 'distance-user-chat';
			}

			// Append chat messages
			html += `
                        <div class='`+ addClass + `' id='` + chats[x]['_id'] + `'>
                            <h5><span>`+ chats[x]['message'] + `</span></h5>`;
			if (chats[x]['sender_id'] == sender_id) {
				html += `
                        <i class="fa fa-trash" aria-hidden="true" data-id='` + chats[x]['_id'] + `' data-bs-toggle="modal" data-bs-target="#deleteChatModal"></i>
                        <i class="fa fa-edit" aria-hidden="true" data-id='` + chats[x]['_id'] + `' data-msg='` + chats[x]['message'] + `' data-bs-toggle="modal" data-bs-target="#editChatModal"></i>
                    `;
			}

			html += `
                        <h5>
                        </h5>
                    </div>
                    `;
		}
		$('#chat-container').append(html); // Append all chats at once

		scrollChat(); // Scroll to the bottom after loading chats
	});

	// Online/offline status updates
	socket.on('getOnlineUser', function (data) {
		$('#' + data.user_id + '-status').text('Online')
			.removeClass('offline-status')
			.addClass('online-status');
	});

	socket.on('getOfflineUser', function (data) {
		$('#' + data.user_id + '-status').text('Offline')
			.removeClass('online-status')
			.addClass('offline-status');
	});
});

function scrollChat() {
	$('#chat-container').animate({
		scrollTop: $('#chat-container').offset().top + $('#chat-container')[0].scrollHeight
	}, 0);
}

// delete chat work
$(document).on('click', '.fa-trash', function () {
	let msg = $(this).parent().text();
	$('#delete-message').text(msg);
	$('#delete-message-id').val($(this).attr('data-id'));
});

// Handle delete chat form submission
$('#delete-chat-form').submit(function (e) {
	e.preventDefault();

	let id = $('#delete-message-id').val();

	$.ajax({
		url: '/delete-chat',
		type: 'POST',
		data: {
			id: id
		},
		success: function (response) {
			if (response.success == true) {
				$('#' + id).remove(); // Remove the chat message from the DOM
				$('#deleteChatModal').modal('hide'); // Hide the modal
				socket.emit('chatDeleted', id); // Notify other users about the deletion
			} else {
				alert(response.msg);
			}
		}
	});
});

// Listen for chat deletions from the server
socket.on('chatMessageDeleted', function (id) {
	$('#' + id).remove(); // Remove the chat message from the DOM
});

// update user chat functionality
$(document).on('click', '.fa-edit', function () {
	let msg = $(this).attr('data-msg');
	$('#update-message').val(msg);
	$('#edit-message-id').val($(this).attr('data-id'));
});

$('#update-chat-form').submit(function (e) {
	e.preventDefault();

	let id = $('#edit-message-id').val();
	let msg = $('#update-message').val();

	$.ajax({
		url: '/update-chat',
		type: 'POST',
		data: {
			id: id,
			message: msg
		},
		success: function (response) {
			if (response.success == true) {
				$('#editChatModal').modal('hide'); // Hide the modal
				$('#' + id).find('span').text(msg); // Update the chat message in the DOM
				$('#' + id).find('.fa-edit').attr('data-msg', msg); // Update the data-msg attribute
				socket.emit('chatUpdated', { id: id, message: msg }); // Notify other users about the update
			} else {
				alert(response.msg);
			}
		}
	});
});

// Listen for chat updates from the server
socket.on('chatMessageUpdated', function (data) {
	$('#' + data.id).find('span').text(data.message); // Update the chat message in the DOM
});

// add member js
$('.addMember').click(function () {
	let id = $(this).attr('data-id');
	let limit = $(this).attr('data-limit');

	$('#group_id').val(id);
	$('#limit').val(limit);

	$.ajax({
		url: '/get-member',
		type: 'POST',
		data: { group_id: id },
		success: function (res) {
			if (res.success == true) {
				let users = res.data;
				let html = '';

				for (let i = 0; i < users.length; i++) {
					html += `
					<tr>
						<td>
							<input type="checkbox" name="members[]" value="` + users[i]['_id'] + `" />
						</td>
						<td>
							` + users[i]['name'] + `
						</td>
					</tr>
					`;
				}

				$('.addMembersInTable').html(html);
			} else {
				alert(res.msg);
			}
		}
	})
})

// add members form submit
$('#add-member-form').submit(function (e) {
	e.preventDefault();

	let formData = $(this).serialize();
	$.ajax({
		url: '/add-member',
		type: 'POST',
		data: formData,
		success: function (res) {
			if (res.success) {
				$('#add-member-form')[0].reset();
				$('#memberModal').modal('hide');
				alert(res.msg);
			}
		}, error: function (err) {
			console.log(err);
			$('#add-member-error').text(err.responseJSON.msg);
			setTimeout(function () {
				$('#add-member-error').text("");
			}, 3000);
		}
	});
});