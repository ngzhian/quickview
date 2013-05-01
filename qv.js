// youtube embed iframe video size is 854 x 510 and 640 x 390
var qv = function() {
    var qv_url = '#';
    var html = '<div id="qv">' +
        '<iframe id="qv-iframe" width="0" height="0" src="" frameborder="0" allowfullscreen=""></iframe>' +
        '<div id="qv-side">' +
        '<div id="qv-bar">' +
        '<h2 id="qv-title"><a href="' + qv_url + '">Quickview</a></h2>' +
        '<a id="qv-size-toggle" class="contract"></a>' +
        '</div>' +
        '<div id="qv-info"></div>' +
        '<div id="qv-comments"></div>' +
        '</div></div>';

    var body = $('body'), 
    // references to DOM elements
        qv_node,
        iframe, // iframe node itself
        qv_side,
        qv_bar,
        qv_size_toggle,
        qv_info,
        qv_comments,
    // attributes needed for functions
        video_id,
        shown_id = null,
        is_big;

    function initialize() {
        init_dom();
        set_qv_bar_behavior();
        add_window_event_listeners();
    }

    function get_to_work() {
        links = get_all_thumbnail_links();
        add_event_listener_to_all_thumbnail_links(links);
    }

    function init_dom() {
        body.append(html);
        qv_node = body.find('#qv');
        iframe = qv_node.find('iframe');
        qv_side = qv_node.find('#qv-side');
        qv_bar = qv_side.find('#qv-bar');
        qv_size_toggle = qv_bar.find('#qv-size-toggle');
        qv_info = qv_side.find('#qv-info');
        qv_comments = qv_side.find('#qv-comments');
    }

    function set_qv_bar_behavior() {
        set_size_toggle();
        make_qv_bar_draggable();
    }

    function set_size_toggle() {
        qv_size_toggle.click(expand_or_contract);
    }

    function expand_or_contract(click_event) {
        if (is_big) {
            contract();
        } else {
            expand();
        }
        is_big = !is_big;
    }

    function contract() {
        contract_iframe();
        setTimeout(contract_qv_side, 400);
        qv_size_toggle.attr('class', 'expand');
    }

    function expand() {
        expand_qv_side();
        setTimeout(expand_iframe, 800);
        qv_size_toggle.attr('class', 'contract');
    }

    function expand_qv_side() {
        qv_side.attr('class', 'large');
    }

    function contract_qv_side() {
        qv_side.attr('class', 'small');
    }

    function resize_using_class(jquery_object, size) {
        jquery_object.attr('class', size);
    }

    function expand_iframe() {
        set_iframe_size(854, 510);
    }

    function contract_iframe() {
        set_iframe_size(640, 390);
    }

    function make_qv_bar_draggable() {
        qv_node.draggable( {
            handle: "#qv-bar",
        containment: "document"
        } );
    }

    function get_all_thumbnail_links() {
        // video links have href="/watch?v=[0-0a-zA-Z=]+"
        var links = $('a[href*="watch?v="]');
        var thumbnails;
        return jQuery.grep(links, function(node, i){
            // filters out nodes without a <img> has a child node
            // i.e. non-thumbnail links
            thumbnails = $(node).find('img');
            return thumbnails.length != 0;
        });
    }

    function add_event_listener_to_all_thumbnail_links(links) {
        jQuery.each(links, function(index) {
            add_event_listener_to_thumbnail_link($(this));
        });
    }

    function add_event_listener_to_thumbnail_link(link) {
        link.find('img').hoverIntent(function(e) {
            show_qv(link);
        }, function(e) {return;});
        // the second function does nothing, because hoverIntent
        // triggers the the given function twice if only 1 is given
    }

    // Takes a <a> tag with href to a YouTube url and pops up qv
    function show_qv(video_link) {
        video_id = get_video_id_from(video_link);

        update_sizes();
        update_iframe(video_id);
        update_qv_comments(video_id);
        update_attributes(video_id);
    }

    // example url: https://www.youtube.com/watch?v=MCaw6fv8ZxA 
    // regex to use: v(\=|\/)(\w*)
    // the result will be 'v=MCaw6fv8ZxA'
    function get_video_id_from(video_link) {
        var url = video_link.attr('href');
        //console.log(url.match(/v(\=|\/)(\w*)/)[0].substring(2));
        return url.match(/v(\=|\/)([^=&\/]+)/)[0].substring(2);
    }

    function update_sizes() {
        if (shown_id === null) {
            resize_using_class(qv_node, 'large');
        }
    }

    function update_attributes(id) {
        shown = true;
        shown_id = id;
        is_big = true;
    }

    function update_iframe(id) {
        if (shown_id === null) {
            setTimeout(expand_iframe, 800);
        }
        if (shown_id != id) {
            update_iframe_src(make_embed_url_from_video_id(id));
        }
    }

    function update_iframe_src(url) {
        iframe.attr('src', url);
    }

    function make_embed_url_from_video_id(id) {
        return 'http://www.youtube.com/embed/'+video_id+'?autoplay=1';
    }

    function append_qv_info_to_qv() {
        qv_info = make_qv_info();
        get_and_add_qv_info_from_api();
    }

    function make_qv_info() {
        qv_info = '<div class="qv-info"></div>';
        qv_node.append(qv_info);
        return qv_node.find('.qv-info');
    }

    function get_and_add_qv_info_from_api() {
        $.get(get_api_url_for_qv_info(video_id), add_qv_info);
    }

    function get_api_url_for_qv_info(video_id) {
        //'https://www.googleapis.com/youtube/v3/videos
        return 'https://gdata.youtube.com/feeds/api/videos/' +
            video_id + '?v=2';
    }

    function add_qv_info(api_data) {
        var entry = $('entry', api_data);
        var description = entry.find('media\\:description').text();
        //console.log(description);
    }

    function update_qv_comments(id) {
        if (id != shown_id) {
            reset_qv_comments();
            get_and_add_comments_from_api(id);
        }
    }

    function reset_qv_comments() {
        qv_comments.empty();
    }

    function get_and_add_comments_from_api(video_id) {
        $.get(get_api_url_for_comments(video_id), add_comments);
    }

    function get_api_url_for_comments(video_id) {
        return 'https://gdata.youtube.com/feeds/api/videos/' +
            video_id + '/comments'
    }

    function add_comments(api_data) {
        $('entry', api_data).each(function() {
            qv_comments.append(form_nice_comment($(this)));
        });
    }

    function form_nice_comment(entry) {
        var author = entry.find('author').find('name').text();
        var date = entry.find('published').text();
        var content = entry.find('content').text();

        var comment = '<div class="qv-comment">' +
            '<span class="qv-author">' + author + '</span>' +
            '<span class="qv-date">' + form_nice_date(date) + '</span>' +
            '<p class="qv-content">' + content + '</p>' +
            '</div>';
        return comment;
    }

    // date is in the format yyyy-mm-ddThh:mm:ss.000Z
    function form_nice_date(date) {
        return date.slice(5,10) + " " + date.slice(11,16);
    }

    function add_window_event_listeners() {
        $(document).click(clears_qv_on_click)
            .keypress(clears_qv_on_keypress);
    }

    function clears_qv_on_click(click_event) {
        if (click_is_not_in_qv(click_event)) {
            reset_all();
        }
    }

    function click_is_not_in_qv(click_event) {
        return !jQuery.contains($('#qv')[0], click_event.target);
    }

    function clears_qv_on_keypress(keypress_event) {
        reset_all();
    }

    function reset_all() {
        reset_iframe();
        reset_qv_comments();
        setTimeout(reset_qv_node, 400);
        reset_attributes();
        expand_qv_side();
    }

    function reset_iframe() {
        set_iframe_size(0, 0);
        update_iframe_src('');
    }

    function set_iframe_size(width, height) {
        iframe.attr('width', width + 'px')
            .attr('height', height + 'px');
    }

    function reset_qv_node() {
        qv_node.attr('class', '');
        qv_node.attr('style', '');
    }

    function reset_attributes() {
        shown = false;
        shown_id = null;
        is_big = true;
    }

    function watch_for_new_page_load() {
        $('.feed-container').on('DOMNodeInserted DOMNodeRemoved',
                get_to_work);
    }

    initialize();
    get_to_work();
    watch_for_new_page_load();

}();
