var toggle_task_timer = false;
var lock_highlight = false;
var task_management_timer = {};

function getParameterByName(name) {
  name = name.replace(/[\[]/, "\\[").replace(/[\]]/, "\\]");
  var regex = new RegExp("[\\?&]" + name + "=([^&#]*)"),
      results = regex.exec(location.search);
  return results === null ? "" : decodeURIComponent(results[1].replace(/\+/g, " "));
}

function show_msg(msg, type, timeout) {
  $("#alert").fadeTo(0, 500).slideDown(500, function(){
    classes = "navbar-fixed-bottom alert col-md-12 pull-right " + type;
    $("#alert").removeClass();
    $("#alert").addClass(classes);
    $("#alert").show();
    $("#alert").html(msg);
  });

  window.setTimeout(function() {
    $("#alert").fadeTo(500, 0).slideUp(500, function(){
      $("#alert").hide();
    });
  }, timeout);
}

function clear_pannel_info() {
  $("#node-details").html('');
}

function getTemplateAjax(path, callback) {
  var source;
  var template;

  $.ajax({
    url: '/static/assets/templates/' + path,
    cache: false,
    success: function(data) {
      source    = data;
      template  = Handlebars.compile(source);

      //execute the callback if passed
      if (callback) callback(template);
    }
  });
}

function display_paths(source, destination, paths) {
  lock_highlight = true;
  $("nav").show();
  clear_pannel_info();

  getTemplateAjax('paths-details.handlebars', function(template) {
    var context = {source: source,
                   destination: destination,
                   paths: paths};
    $('#node-details').html(template(context));

    $("#path-details-table tbody tr").hover(function () {
      $(this).find('span').each(function () {
        var source = $(this).text().replace(/:/g, '\\\:').replace(/\./g, '\\\.');
        d3.selectAll('.link-' + source).attr("style", "stroke: #FFF; stroke-width: 8px;");
      });}, function () {
        $(this).find('span').each(function () {
          var source = $(this).text().replace(/:/g, '\\\:').replace(/\./g, '\\\.');
          d3.selectAll('.link-' + source).attr("style", "");
        });
      });
  });
}

function alto_path_manager(paths) {
  lock_highlight = true;
  $("nav").show();
  clear_pannel_info();

  getTemplateAjax('alto-route-management.handlebars', function(template) {

    // Test part
    // paths.push({path: ['src_host1', 'node1', 'node2', 'node3', 'node4', 'node5', 'dest_host2'], tc: 10000000});
    // paths.push({path: ['src_host0', 'node9', 'node8', 'node3', 'node4', 'node6', 'dest_host5']});
    // paths.push({path: ['src_host3', 'node7', 'node8', 'node3', 'node4', 'node6', 'dest_host4'], tc: 40000000});

    var context = {paths: paths};
    $('#node-details').html(template(context));

    $("#route-management-table tbody tr").hover(function () {
      var route = $(this).find('td:first a').data('route').split(',');
      route.slice(0, -1).forEach(function (e) {
        var source = e.replace(/:/g, '\\\:').replace(/\./g, '\\\.');
        d3.selectAll('.link-' + source).attr("style", "stroke: #FFF; stroke-width: 8px;");
      });}, function () {
        var route = $(this).find('td:first a').data('route').split(',');
        route.slice(0, -1).forEach(function (e) {
          var source = e.replace(/:/g, '\\\:').replace(/\./g, '\\\.');
          d3.selectAll('.link-' + source).attr("style", "");
        });
      });

    $(".tc-update, .tc-create").click(function(e) {
      var spans = $(this).parent().prev().prev().children();
      var source_ip = spans.first().text();
      var destination_ip = spans.last().text();
      var modal = $("#SPCERateControllerModal");
      var source = modal.find("#l3source").text(source_ip);
      var destination = modal.find("#l3destination").text(destination_ip);
      if ($(this).attr("class").indexOf("update") > 0) {
        modal.find("#ALTORateControllerForm").attr("action", "update");
      } else {
        modal.find("#ALTORateControllerForm").attr("action", "create");
      }

      modal.modal();
    });
  });
}

function alto_task_manager(tasks) {
  lock_highlight = true;
  $("nav").show();
  clear_pannel_info();
  // TODO: dispay tasks stat
  getTemplateAjax('alto-task-management.handlebars', function(template) {
    // Test part
    // tasks.push({id: "i", source: "10.0.0.1:/volume/test1", destination: "10.0.0.2:/volume/test2", size: 10000, remain: 5000, speed: 100000, limit: 200000});
    // tasks.push({id: "j", source: "10.0.0.3:/volume/test3", destination: "10.0.0.2:/volume/test4", size: 50000, remain: 1000, speed: 200000, limit: 200000});
    // tasks.push({id: "k", source: "10.0.0.4:/volume/test5", destination: "10.0.0.3:/volume/test6", size: 100000, remain: 5000, speed: 100000, limit: 100000});

    var context = {tasks: tasks};
    $('#node-details').html(template(context));
  });
}

function plot_flow(clean_flow_id, table_id, node_id) {
  clear_pannel_info();

  $.ajax({
    url: "/api/flow/" + node_id + "/" + table_id + "/" + clean_flow_id,
    cache: false,
    headers: {
      "Authorization": "Basic " + (Cookies.get('auth') || "")
    },
    statusCode: {
      401: function() {
        window.location.href = "/login.html";
      }
    },
    success: function(data) {
      console.log(data);
      /*
       var flow_id = Object.keys(data)[0];
       var flow = data[flow_id];
       getTemplateAjax('/static/assets/templates/flow-details.handlebars', function(template) {
       var context = {flow: flow};
       $('#flow-details-handlebars').html(template(context));
       });
       */
    },
  });

  /*
   node = get_node_details(node_id);
   table = node[node_id]['tables'][table_id][0];
   operational = table['operational_flows'];
   flow_details = null;
   operational.forEach(function(op) {
   key = Object.keys(op)[0];
   if (op[key]['clean_id'] == clean_flow_id) {
   flow_details = op[key];
   flow_details['node_id'] = node_id;
   }
   });

   var source = $("#plot-flow-template").html();
   var context = {flow: flow_details};


   var template = Handlebars.compile($.trim(source));
   var html = template(context);
   $("#node-details").html(html);
   */
}

Handlebars.registerHelper("len", function(json) {
  return Object.keys(json).length;
});
