$("#menu-toggle").click(function(e) {
  e.preventDefault();
  $("#wrapper").toggleClass("toggled");
  $("nav").toggleClass("narrow");
});

$("#zoom-mode").click(function(e) {
  $('#zoom-mode').toggleClass('active');
  chart.zoom = !chart.zoom;
});

$("#show-single-flow").click(function(e) {
  plot_mode = SINGLE_FLOW;
  $('#flip').prop('disabled', false);
  clearInterval(plot_flow_interval);
  plot_flow_traffic();
  plot_flow_interval = setInterval(plot_flow_traffic, REFRESH_FREQ * 1000);
});

$("#show-round-trip").click(function(e) {
  plot_mode = ROUND_TRIP;
  $('#flip').prop('disabled', true);
  clearInterval(plot_flow_interval);
  plot_flow_traffic();
  plot_flow_interval = setInterval(plot_flow_traffic, REFRESH_FREQ * 1000);
});

$("#show-path").click(function(e) {
  plot_mode = EXPLORE_PATH;
  $('#flip').prop('disabled', false);
  clearInterval(plot_flow_interval);
  plot_flow_traffic();
  plot_flow_interval = setInterval(plot_flow_traffic, REFRESH_FREQ * 1000);
});

$("#show-round-trip-path").click(function(e) {
  plot_mode = EXPLORE_ROUND_TRIP_PATH;
  $('#flip').prop('disabled', true);
  clearInterval(plot_flow_interval);
  plot_flow_traffic();
  plot_flow_interval = setInterval(plot_flow_traffic, REFRESH_FREQ * 1000);
});

$("#show-all-flow").click(function(e) {
  plot_mode = ALL_FLOW;
  $('#flip').prop('disabled', true);
  clearInterval(plot_flow_interval);
  plot_flow_traffic();
  plot_flow_interval = setInterval(plot_flow_traffic, REFRESH_FREQ * 1000);
});

$("#flip").click(function(e) {
  $(this).toggleClass("active");
  flip = !flip;
  clearInterval(plot_flow_interval);
  plot_flow_traffic();
  plot_flow_interval = setInterval(plot_flow_traffic, REFRESH_FREQ * 1000);
});

var TIME_SCALE_MAP = {
  'last-15min': 60*15,
  'last-2hour': 60*60*2,
  'last-12hour': 60*60*12,
  'last-1day': 60*60*24,
  'last-3day': 60*60*24*3,
  'last-1week': 60*60*24*7,
  'last-1month': 60*60*24*30,
  'last-3month': 60*15*24*92,
  'last-1year': 60*15*24*365,
};

$("[id^=last-]").click(function(e) {
  var scale = $(this).attr('id');
  time_scale = TIME_SCALE_MAP[scale];
  clearInterval(plot_flow_interval);
  plot_flow_traffic();
  plot_flow_interval = setInterval(plot_flow_traffic, REFRESH_FREQ * 1000);
})

/* Save positions */
d3.select('#save-layout').on('click', function() {
  chart.save_layout();
});

/* Restore positions */
d3.select('#load-layout').on('click', function() {
  chart.load_layout();
});

/* Toggle fixed positions */
d3.select('#toggle-fixed-layout').on('click', function() {
  chart.toggle_fixed_layout();
  if (chart.fix_layout) {
    d3.select('#toggle-fixed-layout i').attr('class', 'fa fa-toggle-on');
  } else {
    d3.select('#toggle-fixed-layout i').attr('class', 'fa fa-toggle-off');
  }
});

/* switch labels */
d3.select('#change-switch-label-none').on('click', function() {
  chart.clear_switch_labels();
});
d3.select('#change-switch-label-id').on('click', function() {
  chart.show_switch_labels('id');
});
d3.select('#change-switch-label-description').on('click', function() {
  chart.show_switch_labels('description');
});
d3.select('#change-switch-label-address').on('click', function() {
  chart.show_switch_labels('ip_address');
});
d3.select('#change-switch-label-manufacturer').on('click', function() {
  chart.show_switch_labels('manufacturer');
});
d3.select('#change-switch-label-hardware').on('click', function() {
  chart.show_switch_labels('hardware');
});
d3.select('#change-switch-label-customize').on('click', function() {
  chart.show_switch_labels('customize');
});

/* port labels */
d3.select('#change-port-label-none').on('click', function() {
  chart.clear_port_labels();
});
d3.select('#change-port-label-number').on('click', function() {
  chart.show_port_labels('port_number');
});
d3.select('#change-port-label-name').on('click', function() {
  chart.show_port_labels('name');
});
d3.select("#unused-ports-toggle").on('click', function() {
  chart.toggle_unused_ports();
});
d3.select("#unused-switches-toggle").on('click', function() {
  chart.toggle_unused_switches();
});

/* host labels */
d3.select('#change-host-label-id').on('click', function() {
  chart.show_host_labels('id');
});
d3.select('#change-host-label-ip').on('click', function() {
    chart.show_host_labels('ip');
});
d3.select('#change-host-label-mac').on('click', function() {
  chart.show_host_labels('mac');
});
d3.select('#change-host-label-customize').on('click', function() {
  chart.show_host_labels('customize');
});

$('#L2RouteCalculationModal').on('show.bs.modal', function (event) {
  var modal = $(this);
  var source = modal.find("#l2source");
  var destination = modal.find("#l2destination");
  var hosts = chart.get_all_hosts();

  source.html('');
  destination.html('');

  for(var i = 0; i < hosts.length; i++) {
    var opt = hosts[i]['node-id'];
    var el = document.createElement("option");
    el.textContent = opt;
    el.value = opt;
    source.append(el);
  }

  for(var i = 0; i < hosts.length; i++) {
    var opt = hosts[i]['node-id'];
    var el = document.createElement("option");
    el.textContent = opt;
    el.value = opt;
    destination.append(el);
  }

  modal.find("#l2source-gateway").prop('disabled', true);
  modal.find("#enable-l2source-gateway").bootstrapToggle('off');
  modal.find("#l2destination-gateway").prop('disabled', true);
  modal.find("#enable-l2destination-gateway").bootstrapToggle('off');

});

$("#L2RouteCalculationFormSubmit").click(function(e) {
  var modal = $('#L2RouteCalculationModal');
  var source = modal.find("#l2source")[0]['value'];
  var destination = modal.find("#l2destination")[0]['value'];
  var source_type = modal.find("#l2source-type").val();
  var enable_source_gateway = modal.find("#enable-l2source-gateway").prop('checked');
  var source_mac, destination_mac;
  var source_vlan, destination_vlan;
  if (enable_source_gateway) {
    source_mac = modal.find("#l2source-address").val() || "";
    source_vlan = modal.find("#l2source-address").val() || "";
  }
  var destination_type = modal.find("#l2destination_type").val();
  var enable_destination_gateway = modal.find("#enable-l2destination-gateway").prop('checked');
  if (enable_destination_gateway) {
    destination_mac = modal.find("#l2destination-address").val() || "";
    destination_vlan = modal.find("#l2destination-vlan").val() || "";
  }

  // Remote Store
  $.ajax({
    type: "POST",
    contentType: "application/json; charset=utf-8",
    url: "/api/routes/l2",
    headers: {
      "Authorization": "Basic " + (Cookies.get('auth') || "")
    },
    statusCode: {
      401: function() {
        window.location.href = "/login.html";
      }
    },
    data: JSON.stringify({'source': source,
                          'source-mac': source_mac || '',
                          'source-vlan': source_vlan || '',
                          'destination': destination,
                          'destination-mac': destination_mac || '',
                          'destination-vlan': destination_vlan || ''}),
    success: function (data) {
      display_paths(source, destination, data['paths']);
      modal.modal('toggle');
      var confirm_modal = $("#PathFlowsConfirmationModal");
      var type = confirm_modal.find("#type")[0];
      type.value = "l2";
    },
    dataType: "json"
  });

});

$('#enable-l2source-gateway').change(function() {
  var modal = $("#L2RouteCalculationModal");
  var source_gateway = modal.find('#l2source-gateway');
  var source = modal.find("#l2source");
  if ($(this).prop('checked')) {
    source_gateway.prop('disabled', false);
    var switches = chart.get_all_switches();

    source_gateway.html('<option value="" disabled selected style="display:none;">Choose a gateway</option>');
    source.html('<option value="" disabled selected style="display:none;">Choose a gateway port</option>');

    switches.forEach(function(sw) {
      var opt = sw.id + ' - ' + sw.customize;
      var el = document.createElement("option");
      el.textContent = opt;
      el.value = sw.id;
      source_gateway.append(el);
    });
    $("#l2source-input").show();
  } else {
    $("#l2source-input").hide();
    $('#l2source-gateway').prop('disabled', true);
    source_gateway.html('<option value="" disabled selected style="display:none;">Choose a gateway</option>');

    var hosts = chart.get_all_hosts();
    source.html('');

    for(var i = 0; i < hosts.length; i++) {
      var opt = hosts[i]['node-id'];
      var el = document.createElement("option");
      el.textContent = opt;
      el.value = opt;
      source.append(el);
    }
  }
});

$('#l2source-gateway').change(function() {
  if (!$(this).prop('disabled')) {
    var ports = chart.get_all_ports_in_switch($(this).val());
    var source = $('#l2source');

    source.html('<option value="" disabled selected style="display:none;">Choose a gateway port</option>');

    ports.forEach(function(port) {
      var opt = port.id + ' - ' + port.name;
      var el = document.createElement("option");
      el.textContent = opt;
      el.value = port.id;
      source.append(el);
    });
  }
});

$('#enable-l2destination-gateway').change(function() {
  var modal = $("#L2RouteCalculationModal");
  var destination_gateway = modal.find('#l2destination-gateway');
  var destination = modal.find("#l2destination");
  if ($(this).prop('checked')) {
    destination_gateway.prop('disabled', false);
    var switches = chart.get_all_switches();

    destination_gateway.html('<option value="" disabled selected style="display:none;">Choose a gateway</option>');
    destination.html('<option value="" disabled selected style="display:none;">Choose a gateway port</option>');

    switches.forEach(function(sw) {
      var opt = sw.id + ' - ' + sw.customize;
      var el = document.createElement("option");
      el.textContent = opt;
      el.value = sw.id;
      destination_gateway.append(el);
    });
    $("#l2destination-input").show();
  } else {
    $("#l2destination-input").hide();
    $('#l2destination-gateway').prop('disabled', true);
    destination_gateway.html('<option value="" disabled selected style="display:none;">Choose a gateway</option>');

    var hosts = chart.get_all_hosts();

    destination.html('');

    for(var i = 0; i < hosts.length; i++) {
      var opt = hosts[i]['node-id'];
      var el = document.createElement("option");
      el.textContent = opt;
      el.value = opt;
      destination.append(el);
    }
  }
});

$('#l2destination-gateway').change(function() {
  if (!$(this).prop('disabled')) {
    var ports = chart.get_all_ports_in_switch($(this).val());
    var destination = $('#l2destination');

    destination.html('<option value="" disabled selected style="display:none;">Choose a gateway port</option>');

    ports.forEach(function(port) {
      var opt = port.id + ' - ' + port.name;
      var el = document.createElement("option");
      el.textContent = opt;
      el.value = port.id;
      destination.append(el);
    });
  }
});

$('#l2destination-type').change(function() {
  var type = $(this).val();
  if (type == "address") {
    $('#l2destination-address').attr('placeholder', 'Specify the MAC address for destination');
  } else if (type == "vlan") {
    $('#l2destination-address').attr('placeholder', 'Specify the VLAN ID for destination');
  }
});

$('#L3RouteCalculationModal, #ALTORouteCalculationModal').on('show.bs.modal', function (event) {
  var modal = $(this);
  var source = modal.find("#l3source");
  var destination = modal.find("#l3destination");
  var hosts = chart.get_all_hosts();

  source.html('');
  destination.html('');

  for(var i = 0; i < hosts.length; i++) {
    var addresses = hosts[i]['host-tracker-service:addresses'];
    for (var j = 0; j < addresses.length; j++) {
      var ip = addresses[j]['ip'];
      var mac = addresses[j]['mac'];

      var el = document.createElement("option");
      el.textContent = ip + " - " + mac;
      el.value = ip;
      source.append(el);
    }
  }

  for(var i = 0; i < hosts.length; i++) {
    var addresses = hosts[i]['host-tracker-service:addresses'];
    for (var j = 0; j < addresses.length; j++) {
      var ip = addresses[j]['ip'];
      var mac = addresses[j]['mac'];

      var el = document.createElement("option");
      el.textContent = ip + " - " + mac;
      el.value = ip;
      destination.append(el);
    }
  }

  modal.find("#l3source-gateway").prop('disabled', true);
  modal.find("#enable-l3source-gateway").bootstrapToggle('off');
  modal.find("#l3destination-gateway").prop('disabled', true);
  modal.find("#enable-l3destination-gateway").bootstrapToggle('off');

  var enable = modal.find("#enable-rate-limit");
  var rl = modal.find("#rate-limit");
  var bs = modal.find("#burst-size");
  enable.change(function(e) {
    if (enable.prop('checked')) {
      rl.prop('disabled', false);
      bs.prop('disabled', false);
    } else {
      rl.prop('disabled', true);
      bs.prop('disabled', true);
    }
  });

});

$("#L2L3RouteManagement").click(function (event) {
  $.ajax({
    type: "GET",
    contentType: "application/json; charset=utf-8",
    url: "api/route/list",
    headers: {
      "Authorization": "Basic " + (Cookies.get('auth') || "")
    },
    statusCode: {
      401: function() {
        window.location.href = "/login.html";
      }
    },
    success: function (data) {
      alto_path_manager(data['paths']);
    },
    dataType: "json"
  });
});

$("#ALTOTaskSubmissionModal").on('show.bs.modal', function (event) {
  var modal = $(this);
  var source = modal.find("#l3source")[0];
  var destination = modal.find("#l3destination")[0];
  $.ajax({
    method: 'GET',
    contentType: "application/json; charset=utf-8",
    url: "/api/spce/task/sites",
    headers: {
      "Authorization": "Basic " + (Cookies.get('auth') || "")
    },
    statusCode: {
      401: function() {
        window.location.href = "/login.html";
      }
    },
    success: function (data) {
      var servers = data['servers'];
      var clients = data['clients'];
      while (source.children.length > 0) {
        source.children[0].remove();
      }

      while (destination.children.length >0) {
        destination.children[0].remove();
      }

      for(var i = 0; i < servers.length; i++) {
        var el = document.createElement("option");
        el.textContent = servers[i];
        el.value = servers[i];
        source.appendChild(el);
      }

      for(var i = 0; i < clients.length; i++) {
        var el = document.createElement("option");
        el.textContent = clients[i];
        el.value = clients[i];
        destination.appendChild(el);
      }
    }
  });

});


$("#L3RouteCalculationFormSubmit").click(function(e) {
  var modal = $("#L3RouteCalculationModal");
  var source = modal.find("#l3source")[0]['value'];
  var destination = modal.find("#l3destination")[0]['value'];
  var enable_source_gateway = modal.find("#enable-l3source-gateway").prop('checked');
  var source_type = modal.find("#l3source-type").val();
  var source_ip, destination_ip;
  var source_vlan, destination_vlan;
  if (enable_source_gateway) {
    if (source_type == 'address') {
      source_ip = modal.find("#l3source-address").val();
    }
    else if (source_type == 'vlan') {
      source_vlan = modal.find("#l3source-address").val();
    }
  }
  var destination_type = modal.find("#l3destination_type").val();
  var enable_destination_gateway = modal.find("#enable-l3destination-gateway").prop('checked');
  if (enable_destination_gateway) {
    if (destination_type == 'address') {
      destination_ip = modal.find("#l3destination-address").val();
    }
    else if (destination_type == 'vlan') {
      destination_vlan = modal.find("#l3destination-vlan").val();
    }
  }

  // Remote Store
  $.ajax({
    type: "POST",
    contentType: "application/json; charset=utf-8",
    url: "/api/routes/l3",
    headers: {
      "Authorization": "Basic " + (Cookies.get('auth') || "")
    },
    statusCode: {
      401: function() {
        window.location.href = "/login.html";
      }
    },
    data: JSON.stringify({'source': source,
                          'source-ip': source_ip || '',
                          'source-vlan': source_vlan || '',
                          'destination': destination,
                          'destination-ip': destination_ip || '',
                          'destination-vlan': destination_vlan || ''}),
    success: function (data) {
      display_paths(source, destination, data['paths']);
      modal.modal('toggle');
      var confirm_modal = $("#PathFlowsConfirmationModal");
      var type = confirm_modal.find("#type")[0];
      type.value = "l3";
    },
    dataType: "json"
  });

});

$('#enable-l3source-gateway').change(function() {
  var modal = $("#L3RouteCalculationModal");
  var source_gateway = modal.find('#l3source-gateway');
  var source = modal.find("#l3source");
  if ($(this).prop('checked')) {
    source_gateway.prop('disabled', false);
    var switches = chart.get_all_switches();

    source_gateway.html('<option value="" disabled selected style="display:none;">Choose a gateway</option>');
    source.html('<option value="" disabled selected style="display:none;">Choose a gateway port</option>');

    switches.forEach(function(sw) {
      var opt = sw.id + ' - ' + sw.customize;
      var el = document.createElement("option");
      el.textContent = opt;
      el.value = sw.id;
      source_gateway.append(el);
    });
    $("#l3source-input").show();
  } else {
    $("#l3source-input").hide();
    $('#l3source-gateway').prop('disabled', true);
    source_gateway.html('<option value="" disabled selected style="display:none;">Choose a gateway</option>');

    var hosts = chart.get_all_hosts();
    source.html('');

    for(var i = 0; i < hosts.length; i++) {
      var addresses = hosts[i]['host-tracker-service:addresses'];
      for (var j = 0; j < addresses.length; j++) {
        var ip = addresses[j]['ip'];
        var mac = addresses[j]['mac'];

        var el = document.createElement("option");
        el.textContent = ip + " - " + mac;
        el.value = ip;
        source.append(el);
      }
    }
  }
});

$('#l3source-gateway').change(function() {
  if (!$(this).prop('disabled')) {
    var ports = chart.get_all_ports_in_switch($(this).val());
    var source = $('#l3source');

    source.html('<option value="" disabled selected style="display:none;">Choose a gateway port</option>');

    ports.forEach(function(port) {
      var opt = port.id + ' - ' + port.name;
      var el = document.createElement("option");
      el.textContent = opt;
      el.value = port.id;
      source.append(el);
    });
  }
});

$('#l3source-type').change(function() {
  var type = $(this).val();
  if (type == "address") {
    $('#l3source-address').attr('placeholder', 'Specify the MAC address for destination');
  } else if (type == "vlan") {
    $('#l3source-address').attr('placeholder', 'Specify the VLAN ID for destination');
  }
});

$('#enable-l3destination-gateway').change(function() {
  var modal = $("#L3RouteCalculationModal");
  var destination_gateway = modal.find('#l3destination-gateway');
  var destination = modal.find("#l3destination");
  if ($(this).prop('checked')) {
    destination_gateway.prop('disabled', false);
    var switches = chart.get_all_switches();

    destination_gateway.html('<option value="" disabled selected style="display:none;">Choose a gateway</option>');
    destination.html('<option value="" disabled selected style="display:none;">Choose a gateway port</option>');

    switches.forEach(function(sw) {
      var opt = sw.id + ' - ' + sw.customize;
      var el = document.createElement("option");
      el.textContent = opt;
      el.value = sw.id;
      destination_gateway.append(el);
    });
    $("#l3destination-input").show();
  } else {
    $("#l3destination-input").hide();
    $('#l3destination-gateway').prop('disabled', true);
    destination_gateway.html('<option value="" disabled selected style="display:none;">Choose a gateway</option>');

    var hosts = chart.get_all_hosts();

    destination.html('');

    for(var i = 0; i < hosts.length; i++) {
      var addresses = hosts[i]['host-tracker-service:addresses'];
      for (var j = 0; j < addresses.length; j++) {
        var ip = addresses[j]['ip'];
        var mac = addresses[j]['mac'];

        var el = document.createElement("option");
        el.textContent = ip + " - " + mac;
        el.value = ip;
        destination.append(el);
      }
    }
  }
});

$('#l3destination-gateway').change(function() {
  if (!$(this).prop('disabled')) {
    var ports = chart.get_all_ports_in_switch($(this).val());
    var destination = $('#l3destination');

    destination.html('<option value="" disabled selected style="display:none;">Choose a gateway port</option>');

    ports.forEach(function(port) {
      var opt = port.id + ' - ' + port.name;
      var el = document.createElement("option");
      el.textContent = opt;
      el.value = port.id;
      destination.append(el);
    });
  }
});

$('#l3destination-type').change(function() {
  var type = $(this).val();
  if (type == "address") {
    $('#l3destination-address').attr('placeholder', 'Specify the MAC address for destination');
  } else if (type == "vlan") {
    $('#l3destination-address').attr('placeholder', 'Specify the VLAN ID for destination');
  }
});

$("#ALTORouteManagementTab").click(function(e) {
  $.ajax({
    type: "POST",
    contentType: "application/json; charset=utf-8",
    url: "api/spce/path/retrieve",
    headers: {
      "Authorization": "Basic " + (Cookies.get('auth') || "")
    },
    statusCode: {
      401: function() {
        window.location.href = "/login.html";
      }
    },
    data: JSON.stringify({}),
    success: function (data) {
      alto_path_manager(data['paths']);
    },
    dataType: "json"
  });
});

$("#ALTOTaskManagementTab").click(function (e) {
  toggle_task_timer = true;
  task_management_timer = function () {
    if (toggle_task_timer) {
      $.ajax({
        type: "POST",
        contentType: "application/json; charset=utf-8",
        url: "api/spce/task/stat",
        headers: {
          "Authorization": "Basic " + (Cookies.get('auth') || "")
        },
        statusCode: {
          401: function() {
            window.location.href = "/login.html";
          }
        },
        data: JSON.stringify({}),
        success: function (data) {
          alto_task_manager(data['tasks']);
        },
        error: function (xhr, status, error) {
          alto_task_manager([]);
        },
        dataType: "json"
      });
      setTimeout(task_management_timer, 2000);
    }
  };
  task_management_timer();
});

$("#ALTORouteRemoveModal").on("show.bs.modal", function (event) {
  var button = $(event.relatedTarget);
  var route = button.data('route');
  var modal = $(this);
  modal.find("#route").data('route', route.replace(/,/g, '|'));
  modal.find("#route").html('<span class="label label-primary">' + route.replace(/,/g, '</span><span class="label label-primary">') + '</span>');
});

$("#ALTORateRemoveModal").on("show.bs.modal", function (event) {
  var button = $(event.relatedTarget).parent().siblings()
        .first().children().first();
  var route = button.data('route');
  var modal = $(this);
  modal.find("#route").data('route', route.replace(/,/g, '|'));
  modal.find("#route").html('<span class="label label-primary">' + route.replace(/,/g, '</span><span class="label label-primary">') + '</span>');
});

$("#ALTORemoveRouteFormSubmit").click(function (e) {
  var form = $(this).parent().parent();
  var route = form.find("#route").data("route");
  $.ajax({
    type: "POST",
    contentType: "application/json; charset=utf-8",
    url: "api/spce/path/remove",
    headers: {
      "Authorization": "Basic " + (Cookies.get('auth') || "")
    },
    statusCode: {
      401: function() {
        window.location.href = "/login.html";
      }
    },
    data: JSON.stringify({'path': route}),
    success: function (data) {
      $('#ALTORouteRemoveModal').modal('hide');
      $("#ALTORouteManagementTab").click();
    }
  });
});

$("#SPCESetupPathFormSubmit").click(function(e) {
  var modal = $("#ALTORouteCalculationModal");
  var source = modal.find("#l3source").val();
  var destination = modal.find("#l3destination").val();
  var obj_metrics = [modal.find("#obj-metrics").val()];
  var constraints = [{'metric': 'hopcount',
                      'min': parseInt(modal.find("#min-hopcount").val()) || 0,
                      'max': parseInt(modal.find("#max-hopcount").val()) || 100000000000},
                     {'metric': 'bandwidth',
                      'min': parseInt(modal.find("#min-bandwidth").val()) || 0,
                      'max': parseInt(modal.find("#max-bandwidth").val()) || 100000000000}];
  var en_rl = modal.find("#enable-rate-limit").prop('checked');
  var bw = parseInt(modal.find("#rate-limit").val()) || 1000000;
  var bs = parseInt(modal.find("#burst-size").val()) || bw;

  $.ajax({
    type: "POST",
    contentType: "application/json; charset=utf-8",
    url: "api/spce/path/setup",
    headers: {
      "Authorization": "Basic " + (Cookies.get('auth') || "")
    },
    statusCode: {
      401: function() {
        window.location.href = "/login.html";
      }
    },
    data: JSON.stringify({'source': source,
                          'destination': destination,
                          'obj_metrics': obj_metrics,
                          'constraints': constraints}),
    success: function (data) {
      modal.modal('hide');
      // TODO: feedback
      if (!en_rl) {
        $("#ALTORouteManagementTab").click();
      } else {
        $.ajax({
          type: "POST",
          contentType: "application/json; charset=utf-8",
          url: "api/spce/tc/set",
          headers: {
            "Authorization": "Basic " + (Cookies.get('auth') || "")
          },
          statusCode: {
            401: function() {
              window.location.href = "/login.html";
            }
          },
          data: JSON.stringify({'source': source,
                                'destination': destination,
                                'bandwidth': bw,
                                'bs': bs,
                                'operation': 'create'}),
          success: function (data) {
            modal.modal('hide');
            $("#ALTORouteManagementTab").click();
          },
          dataType: "json"
        });
      }
    },
    dataType: "json"
  });
});

$("#SPCERateLimitingFormSubmit").click(function(e) {
  var modal = $("#SPCERateControllerModal");
  var operation = modal.find("#ALTORateControllerForm").attr("action");
  var source = modal.find("#l3source").text();
  var destination = modal.find("#l3destination").text();
  var bandwidth = parseInt(modal.find("#rate-limit").val()) || 1000000;
  var bs = parseInt(modal.find("#burst-size").val()) || bandwidth;
  // Test Input
  $.ajax({
    type: "POST",
    contentType: "application/json; charset=utf-8",
    url: "api/spce/tc/set",
    headers: {
      "Authorization": "Basic " + (Cookies.get('auth') || "")
    },
    statusCode: {
      401: function() {
        window.location.href = "/login.html";
      }
    },
    data: JSON.stringify({'source': source,
                          'destination': destination,
                          'bandwidth': bandwidth,
                          'bs': bs,
                          'operation': operation}),
    success: function (data) {
      modal.modal('hide');
      $("#ALTORouteManagementTab").click();
    },
    dataType: "json"
  });
});

$("#ALTOTaskSubmissionFormSubmit").click(function (e) {
  var modal = $("#ALTOTaskSubmissionModal");
  var source = modal.find("#l3source").val();
  var destination = modal.find("#l3destination").val();
  var source_file = modal.find("#source_file").val();
  var destination_dir = modal.find("#destination_dir").val();
  $.ajax({
    type: "POST",
    contentType: "applicaiton/json; charset=utf-8",
    url: "api/spce/task/submit",
    headers: {
      "Authorization": "Basic " + (Cookies.get('auth') || "")
    },
    statusCode: {
      401: function() {
        window.location.href = "/login.html";
      }
    },
    data: JSON.stringify({'source': source,
                          'destination': destination,
                          'source_file': source_file,
                          'destination_dir': destination_dir}),
    success: function (data) {
      modal.modal('hide');
      $("#ALTOTaskManagementTab").click();
      alert(JSON.stringify(data));
    },
    error: function (xhr, status, error) {
      alert('Submission Failed for Some Reasons...');
      modal.modal('hide');
    },
    dataType: "json"
  });
});

$("#ALTORemoveRateFormSubmit").click(function (e) {
  var form = $(this).parent().parent();
  var route = form.find("#route").text();
  $.ajax({
    type: "POST",
    contentType: "application/json; charset=utf-8",
    url: "api/spce/tc/remove",
    headers: {
      "Authorization": "Basic " + (Cookies.get('auth') || "")
    },
    statusCode: {
      401: function() {
        window.location.href = "/login.html";
      }
    },
    data: JSON.stringify({'path': route}),
    success: function (data) {
      $("#ALTORateRemoveModal").modal('hide');
      $("#ALTORouteManagementTab").click();
    }
  });
});

$('#PathFlowsConfirmationModal').on('show.bs.modal', function (event) {
  var button = $(event.relatedTarget);
  var path_id = button.data('path');
  var path = button.data('pathlist').split(',');
  var source = path[0];
  var destination = path[path.length-1];
  if (!source.startsWith("openflow:")) {
    $("#l2l3source").prop('disabled', true);
    if (source.startsWith("host:")) {
      $("#l2l3source").val(source.slice(5));
    } else {
      $("#l2l3source").val(source);
    }
  }
  if (!destination.startsWith("openflow:")) {
    $("#l2l3destination").prop('disabled', true);
    if (destination.startsWith("host:")) {
      $("#l2l3destination").val(destination.slice(5));
    } else {
      $("#l2l3destination").val(destination);
    }
  }
  // if (source.startsWith("openflow:") || destination.startsWith("openflow:")) {
  //   $("#pathMatchForm").hide();
  // }

  var modal = $(this);
  var type = modal.find("#type")[0].value;
  var endpoint = "/api/flow/path/" + type + "/" + path_id;
  modal.find("#PathFlowsInstallForm").attr("action", endpoint);

  modal.find("#PathFlowsInstallForm").submit(function(event) {
    event.preventDefault();
    var form = $(this);
    var data = {
      source: $("#l2l3source").val(),
      destination: $("#l2l3destination").val()
    };
    submitFormData(endpoint, data);
  });
});

$('#FlowRemoveModal').on('show.bs.modal', function (event) {
  var button = $(event.relatedTarget);
  var flow_id = button.data('flow');
  var table_id = button.data('table');
  var node_id = button.data('node');
  var flow_name = button.data('name');

  var endpoint = "/api/flow/" + node_id + "/" + table_id + "/" + escape(flow_id) + "/delete";

  var modal = $(this);

  modal.find("#RemoveFlowForm").attr("action", endpoint);

  $('#flowid').text(flow_id);
  $('#flowname').text(flow_name);

  modal.find("#RemoveFlowForm").submit(function(event) {
    event.preventDefault();
    var form = $(this);
    var data = {
      'delete_all': form.find("#delete_all").val()
    };
    submitFormData(endpoint, data);
  });

});

$('#FlowLowPriorityRemoveModal').on('show.bs.modal', function (event) {
  var button = $(event.relatedTarget);
  var node_id = button.data('node');
  var endpoint = "/api/flow/" + node_id + "/0/delete/low";
  var modal = $(this);
  modal.find("#FlowLowPriorityRemoveForm").attr("action", endpoint);

  modal.find("#FlowLowPriorityRemoveForm").submit(function(event) {
    event.preventDefault();
    var form = $(this);
    var data = {};
    submitFormData(endpoint, data);
  });
});


$('#FlowAddModal').on('show.bs.modal', function (event) {
  var button = $(event.relatedTarget);
  var table_id = button.data('table');
  var node_id = button.data('node');

  var endpoint = "/api/flow/" + node_id + "/0";
  var modal = $(this);

  var output_to = modal.find("#output")[0];

  var interfaces = chart.nodes[node_id]['connectors'];

  while (output_to.children.length > 0) {
    output_to.children[0].remove();
  }

  for(var key in interfaces) {
    var el = document.createElement("option");
    el.textContent = key;
    el.value = key.split(":")[2];
    output.appendChild(el);
  }

  var controller = document.createElement("option");
  controller.textContent = "CONTROLLER";
  controller.value = "CONTROLLER";
  output.appendChild(controller);

  modal.find("#FlowAddForm").attr("action", endpoint);
  modal.find("#node_id").attr("value", node_id);

  modal.find("#FlowAddForm").submit(function(event) {
    event.preventDefault();
    var form = $(this);
    var data = {
      'name': form.find("#name").val(),
      'priority': form.find("#priority").val(),
      'eth_type': form.find("#eth_type").val(),
      'eth_source': form.find("#eth_source").val(),
      'eth_destination': form.find("#eth_destination").val(),
      'ipv4_source': form.find("#ipv4_source").val(),
      'ipv4_destination': form.find("#ipv4_destination").val(),
      'output': form.find("#output").val()
    };
    submitFormData(endpoint, data);
  });
});

var submitFormData = function(endpoint, data) {
  $.ajax({
    type: "POST",
    url: endpoint,
    contentType: "applicaiton/json; charset=utf-8",
    headers: {
      "Authorization": "Basic " + (Cookies.get('auth') || "")
    },
    statusCode: {
      401: function() {
        window.location.href = "/login.html";
      }
    },
    data: JSON.stringify(data),
    success: function (data) {
      window.location.href = "/";
    }
  });
}
