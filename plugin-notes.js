/**
 * Automagically make all links in plugin notes have target="_blank"
 */
jQuery(document).ready(function($) {
	jQuery('span.wp-plugin_note a').each(function(){
		jQuery(this).attr( 'target', '_blank' );
	});
});

function add_plugin_note( plugin_slug, plugin_name ) {
	edit_plugin_note(plugin_slug, plugin_name);
}

function edit_plugin_note( plugin_name ) {
	var note_elements = get_plugin_note_elements(plugin_name);

	// Hide note, show form and focus on textarea
	note_elements.box.hide('normal');
	note_elements.form.show('normal');
	note_elements.form.input.focus();
	
}

function delete_plugin_note( plugin_name ) {
	if(confirm(i18n_plugin_notes.confirm_delete)) {
		var note_elements = get_plugin_note_elements(plugin_name);
		note_elements.box.find('.waiting').show();
		note_elements.form.input.val('');
		save_plugin_note( plugin_name );
	}
}

function templatesave_plugin_note( plugin_name ) {
	if(confirm(i18n_plugin_notes.confirm_new_template)) {
		var template_switch = document.getElementById('wp-plugin_note_new_template_'+plugin_name);
		template_switch.value = 'y';
		save_plugin_note( plugin_name );
	}
}

function cancel_plugin_note( plugin_name ) {
	var note_elements = get_plugin_note_elements(plugin_name);
	
	note_elements.box.show('normal');
	note_elements.form.hide('normal');
}

function save_plugin_note( plugin_name ) {
	var note_elements = get_plugin_note_elements(plugin_name);
	// Get form values
	var _nonce = jQuery('input[name=wp-plugin_notes_nonce]').val();
	var plugin_slug = jQuery('input[name=wp-plugin_note_slug_'+plugin_name+']').val();
	var plugin_note_color = jQuery('#wp-plugin_note_color_'+plugin_name).val();
	var plugin_new_template = jQuery('input[name=wp-plugin_note_new_template_'+plugin_name+']').val();
	var plugin_note = note_elements.form.input.val();
	
	// Show waiting container
	note_elements.form.find('.waiting').show();

	// Prepare data
	var post = {};
	post.action = 'plugin_notes_edit_comment';
	post.plugin_name = plugin_name;
	post.plugin_note = plugin_note;
	post.plugin_slug = plugin_slug;
	post.plugin_note_color = plugin_note_color;
	post.plugin_new_template = plugin_new_template;
	post._nonce = _nonce;

	// Send the request
	jQuery.ajax({
		type : 'POST',
		url : (ajaxurl) ? ajaxurl : 'admin-ajax.php',
		data : post,
		success : function(xml) { plugin_note_saved(xml, note_elements); },
		error : function(xml) { plugin_note_error(xml, note_elements); }
	});

	return false;
	
}

function plugin_note_saved ( xml, note_elements ) {
	var response;
						
	// Uh oh, we have an error
	if ( typeof(xml) == 'string' ) {
		plugin_note_error({'responseText': xml}, note_elements);
		return false;
	}
	
	// Parse the response
	response = wpAjax.parseAjaxResponse(xml);
	
	if ( response.errors ) {
		// Uh oh, errors found
		plugin_note_error({'responseText': wpAjax.broken}, note_elements);
		return false;
	}
	
	response = response.responses[0];
	
	// Add/Delete new content
	note_elements.form.find('.waiting').hide();
	
	/**
	 * Update the plugin note after edit/delete action
	 */
	if(response.action.indexOf('save_template') == -1 ) {
		note_elements.box.parent().after(response.data);
		note_elements.box.parent().remove();
		note_elements.form.hide('normal');
		
		jQuery('#wp-plugin_note_'+note_elements.name+' span.wp-plugin_note a').each(function(){
			jQuery(this).attr( 'target', '_blank' );
		});

	}
	/**
	 * Update *all* empty notes with the new template after save_template action
	 * Reset the save_template switch
	 * Display success message
	 */
	else {
		jQuery('textarea.new_note').each(function(){
			jQuery(this).val( note_elements.form.input.val() );
		});
		var template_switch = document.getElementById('wp-plugin_note_new_template_'+note_elements.name);
		template_switch.value = 'n';

		note_elements.form.find('span.success').html(i18n_plugin_notes.success_save_template).show().parent().show();
	}
}

function plugin_note_error ( xml, note_elements ) {
	note_elements.form.find('.waiting').hide();
	if ( xml.responseText ) {
		error = xml.responseText.replace( /<.[^<>]*?>/g, '' );
	} else {
		error = xml;
	}
	if ( error ) {
		note_elements.form.find('span.error').html(error).show().parent().show();
	}
}

function get_plugin_note_elements(name) {
	var elements = {};
	elements.name = name;
	elements.box = jQuery('#wp-plugin_note_'+name);
	elements.form = jQuery('#wp-plugin_note_form_'+name);
	elements.form.input = elements.form.children('textarea');
	return elements;
}
