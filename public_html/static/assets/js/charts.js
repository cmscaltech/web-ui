var D3Force = function(nodes, links, div) {
  this.nodes = nodes;
  this.links = links;
  this.div = div;
  this.width = $(div).parent().width();
  this.height = $(window).height() - 75;
  this.zoom = true;

  var _this = this;

  // Nodes vars
  // var charge = {'switch': 200,
  //               'ovs': 200,
  //               'host': 20,
  //               'port': -20};

  var size = {
    'switch': 55,
    'ovs': 55,
    'host': 20,
    'port': 12
  };

  // Links vars
  var strength = {
    'link': 0.2,
    'port': 1,
    'host': 0.5
  };

  var distance = {
    'link': 6 * size['switch'],
    'port': size['switch'],
    'host': 5 * size['port']
  };

  var THETA = Math.PI/9;

  var tick_times = 100;

  this.positions_cache = {};

  this.switch_labels_type = "customize";
  this.host_labels_type = "customize";

  this.fix_layout = true;

  var pathgen = d3.svg.line().interpolate("basis");

  this.fadein_all = function() {
    d3.selectAll(".node").style("opacity", "0.3");
    d3.selectAll(".link-link, .host-link").style("opacity", "0.3");
  };

  this.fadeout_all = function() {
    d3.selectAll(".node").style("opacity", "1");
    d3.selectAll(".link-link, .host-link").style("opacity", "0.5").style("cursor", null);
    $("nav").hide();
    toggle_task_timer = false;
    clearTimeout(task_management_timer);
    lock_highlight = false;
  };

  this.highlight_link = function(link) {
    _this.fadein_all();
    var d3link = d3.selectAll("." + link.type + "-link.link-id-" + link.id);
    var d3source = d3.selectAll(".node." + link.source.type + "." + link.source.type + "-" + link.source.id.replace(/:/g, "\\\:"));
    var d3target = d3.selectAll(".node." + link.target.type + "." + link.target.type + "-" + link.target.id.replace(/:/g, "\\\:"));
    d3link.style("opacity", "1").style("cursor", "pointer");
    d3source.style("opacity", "1");
    d3target.style("opacity", "1");
  };

  this.highlight_switch = function(node) {
    _this.fadein_all();
    var d3node = d3.selectAll(".node.switch.switch-" + node.id.replace(/:/g, "\\\:") + ", .node.ovs.ovs-" + node.id.replace(/:/g, "\\\:"));
    d3node.style("opacity", "1");
    _this.show_node_details(node);
  };

  this.highlight_port = function(port) {
    for (var key in _this.nodes) {
      if (_this.nodes[key].type == "switch" ||
          _this.nodes[key].type == "ovs") {
        connectors = _this.nodes[key].connectors;
        if (connectors.hasOwnProperty(port.id)) {
          _this.highlight_switch(_this.nodes[key]);
          break;
        }
      }
    }

    var d3node = d3.selectAll(".node.port.port-" + port.id.replace(/:/g, "\\\:"));
    d3node.style("opacity", "1");
  };

  this.highlight_host = function(node) {
    _this.fadein_all();
    var d3node = d3.selectAll(".node.host.host-" + node.id.replace(/:/g, "\\\:"));
    d3node.style("opacity", "1");
    _this.show_node_details(node);
  };

  this.show_node_details = function(node) {
    /* TODO: Maybe this function should not be here. */
    lock_highlight = true;
    $("nav").show();
    clear_pannel_info();

    if (node.type == "switch" || node.type == "ovs") {
      getTemplateAjax('switch-details.handlebars', function(template) {
        var context = node;
        $('#node-details').html(template(context));
        _this.customize_name();
        $('#customize-name').keypress(function (e) {
          if (e.which == 13) {
            _this.set_customize_name();
            if (_this.switch_labels_type == 'customize') {
              _this.show_switch_labels('customize');
            }
          }
        });
        $('#customize-name-apply').click(function (e) {
          _this.set_customize_name();
          if (_this.switch_labels_type == 'customize') {
            _this.show_switch_labels('customize');
          }
        });
      });
    } else if (node.type == "host") {
      getTemplateAjax('host-details.handlebars', function(template) {
        var address = node['host-tracker-service:addresses'][0];
        var attachment_point = node['host-tracker-service:attachment-points'][0];
        var attachment_split = attachment_point['tp-id'].split(':');
        var attachment_port = attachment_split.pop();
        var attachment_switch = attachment_split.join(':');
        var context = {
          'id': address.id,
          'name': node.id,
          'ip': address.ip,
          'mac': address.mac,
          'active': attachment_point.active,
          'attachment_port': attachment_port,
          'attachment_switch': attachment_switch
        };
        $('#node-details').html(template(context));
        _this.customize_name();
        $('#customize-name').keypress(function (e) {
          if (e.which == 13) {
            _this.set_customize_name();
            if (_this.host_labels_type == 'customize') {
              _this.show_host_labels('customize');
            }
          }
        });
        $('#customize-name-apply').click(function (e) {
          _this.set_customize_name();
          if (_this.host_labels_type == 'customize') {
            _this.show_host_labels('customize');
          }
        });
      });
    }
  };

  this.show_link_details = function(link) {
    lock_highlight = true;
    $("nav").show();
    clear_pannel_info();

    getTemplateAjax('link-details.handlebars', function(template) {
      var saddr = link.source.type == "host" ? link.source['host-tracker-service:addresses'][0].ip : link.source.ip_address;
      var taddr = link.target.type == "host" ? link.target['host-tracker-service:addresses'][0].ip : link.target.ip_address;
      var flows = [];
      var connectors = [];

      if (link.source.tables && link.source_port) {
        Object.keys(link.source.tables).forEach(function(id) {
          var sflows = link.source.tables[id].flows;
          Object.keys(sflows).forEach(function(id) {
            if (sflows[id].actions.filter(function(d) {return d.value == link.source_port.port_number;}).length) {
              flows.push(sflows[id]);
            }
          });
        });
      }
      if (link.target.tables && link.target_port) {
        Object.keys(link.target.tables).forEach(function(id) {
          var tflows = link.target.tables[id].flows;
          Object.keys(tflows).forEach(function(id) {
            if (tflows[id].actions.filter(function(d) {return d.value == link.target_port.port_number;}).length) {
              flows.push(tflows[id]);
            }
          });
        });
      }

      if (link.source.connectors) {
        Object.keys(link.source.connectors).forEach(function(id) {
          connectors.push(link.source.connectors[id]);
        });
      }
      if (link.target.connectors) {
        Object.keys(link.target.connectors).forEach(function(id) {
          connectors.push(link.target.connectors[id]);
        });
      }

      var context = {
        'sid': link.source.id,
        'stype': link.source.type,
        'saddr': saddr,
        'tid': link.target.id,
        'ttype': link.target.type,
        'taddr': taddr,
        'capacity': link.capacity,
        'flows': flows,
        'connectors': connectors
      };
      if (link.source_port)
        context.sport = link.source_port.id;
      if (link.target_port)
        context.tport = link.target_port.id;
      $('#node-details').html(template(context));
    });
  };

  this.load_layout = function() {
    show_msg("Loading previous layout saved from server...", "alert-info", 3000);
    $.ajax({
      type: "GET",
      url: "/api/layout",
      headers: {
        "Authorization": "Basic " + (Cookies.get('auth') || "")
      },
      statusCode: {
        401: function() {
          window.location.href = "/login.html";
        },
        404: function() {
          _this.positions_cache = test_layout;
          _this.load_layout_from_positions(_this.positions_cache);
        }
      },
      success: function(positions) {
        _this.positions_cache = positions;
        _this.load_layout_from_positions(_this.positions_cache);
        _this.show_switch_labels(_this.switch_labels_type);
        _this.show_host_labels(_this.host_labels_type);
      },
      dataType: "json"
    });
  };

  this.load_layout_from_positions = function(positions) {
    if (!positions)
      return;
    _this.force.stop();
    d3.selectAll(".node").each(function(node) {
      if (positions[node.id]) {
        node.px = positions[node.id][0];
        node.py = positions[node.id][1];
        node.x = positions[node.id][0];
        node.y = positions[node.id][1];
        node.fixed = true;
        tick();
      }
    });
  };

  this.save_layout = function() {
    show_msg("Saving current layout to server...", "alert-info", 3000);
    d3.selectAll(".node").each(function(d) {
      if (!_this.positions_cache[d.id]) {
        _this.positions_cache[d.id] = [];
      }
      _this.positions_cache[d.id][0] = d.x;
      _this.positions_cache[d.id][1] = d.y;
    });

    // Remote Store
    $.ajax({
      type: "POST",
      contentType: "application/json; charset=utf-8",
      url: "/api/layout",
      headers: {
        "Authorization": "Basic " + (Cookies.get('auth') || "")
      },
      statusCode: {
        401: function() {
          window.location.href = "/login.html";
        }
      },
      data: JSON.stringify(_this.positions_cache),
      success: function(data) {
        console.log("Saved layout");
      },
      dataType: "json"
    });
  };

  this.toggle_fixed_layout = function() {
    _this.fix_layout = !_this.fix_layout;
    if (_this.fix_layout) {
      _this.load_layout_from_positions(_this.positions_cache);
    } else {
      d3.selectAll(".node").each(function(node) {
        node.fixed = false;
        tick();
      });
      _this.force.resume();
    }
  };

  this.show_switch_labels = function(type) {
    _this.clear_switch_labels();

    var switches = d3.selectAll(".node.switch, .node.ovs");
    switches.append("text")
      .attr("x", 0)
      .attr("y", 65)
      .attr("dy", ".35em")
      .style("fill", "white")
      .attr("class", "switch-label")
      .attr("text-anchor", "middle")
      .text(function(d) {
        if (type == 'customize') {
          if (_this.positions_cache &&
              _this.positions_cache[d.id] &&
              _this.positions_cache[d.id][2]) {
            return _this.positions_cache[d.id][2];
          }
          return "NoName " + d.index;
        }
        return d[type];
      });

    _this.switch_labels_type = type;
  };

  this.clear_switch_labels = function() {
    var labels = d3.selectAll(".switch-label");
    labels.remove();
  };



  this.show_host_labels = function(type) {
    _this.clear_host_labels();

    var hosts = d3.selectAll(".host");
    hosts.append("text")
      .attr("x", 0)
      .attr("dy", "2em")
      .style("fill", "white")
      .attr("class", "host-label")
      .attr("text-anchor", "middle")
      .text(function(d) {
        if (type == 'customize') {
          if (_this.positions_cache &&
              _this.positions_cache[d.id] &&
              _this.positions_cache[d.id][2]) {
            return _this.positions_cache[d.id][2];
          }
          return "NoName " + d.index;
        }
        return d['host-tracker-service:addresses'][0][type];
      });

    _this.host_labels_type = type;
  };

  this.clear_host_labels = function() {
    var labels = d3.selectAll(".host-label");
    labels.remove();
  };

  this.show_port_labels = function(type) {
    _this.clear_port_labels();

    var ports = d3.selectAll(".port");
    ports.append("text")
      .attr("x", 0)
      .attr("dy", ".35em")
      .style("fill", "black")
      .attr("class", "port-label")
      .attr("text-anchor", "middle")
      .text(function(d) {
        return d[type];
      });
  };

  this.clear_port_labels = function() {
    var labels = d3.selectAll(".port-label");
    labels.remove();
  };

  this.customize_name = function() {
    var input = $("#customize-name");
    var id = input.data("id");
    if (_this.positions_cache &&
        _this.positions_cache[id] &&
       _this.positions_cache[id][2])
      input.val(_this.positions_cache[id][2]);
  };

  this.set_customize_name = function() {
    var input = $("#customize-name");
    var id = input.data("id");
    var name = input.val();
    if (!_this.positions_cache) {
      _this.positions_cache = {};
    }
    if (!_this.positions_cache[id]) {
      _this.positions_cache[id] = [];
    }
    _this.positions_cache[id][2] = name;
  };

  this.toggle_node_display = function(node) {
    if (node.style("visibility") == "hidden") {
      node.style("visibility", "visible");
    } else {
      node.style("visibility", "hidden");
    }
  };

  this.toggle_unused_ports = function() {
    var ports = d3.selectAll(".node.port")[0];
    ports.forEach(function(port) {
      if (!_this.is_port_used(port.__data__.id)) {
        var id = port.__data__.id;
        var node = d3.selectAll(".node.port.port-" + id.replace(/:/g, "\\\:"));
        _this.toggle_node_display(node);
      }
    });
  };

  this.is_port_used = function(id) {
    var links = _this['links'];
    var found = false;
    links.forEach(function(link) {
      if ((link.type == "link") ||
          (link.type == "host")) {
        if ((link.source.id == id) ||
            (link.target.id == id)) {
          found = true;
        }
      }
    });

    return found;
  };

  this.toggle_unused_switches = function() {
    var switches = d3.selectAll(".node.switch, .node.ovs")[0];
    switches.forEach(function(sw) {
      if (!_this.is_switch_used(sw.__data__.id)) {
        var id = sw.__data__.id;
        var node = d3.selectAll(".node.switch.switch-" + id.replace(/:/g, "\\\:") + ", .node.ovs.ovs-" + id.replace(/:/g, "\\\:"));
        _this.toggle_node_display(node);
      }
    });
  };

  this.is_switch_used = function(id) {
    var links = _this.force.links();
    var found = false;
    links.forEach(function(link) {
      if ((link.source.id == id) ||
          (link.target.id == id)) {
        found = true;
      }
    });

    return found;
  };

  this.get_all_hosts = function() {
    var hosts = [];
    for (var key in _this.nodes) {
      if (_this.nodes[key].type == "host") {
        hosts.push(_this.nodes[key]);
      }
    }
    return hosts;
  };

  this.get_all_switches = function() {
    var switches = [];
    for (var key in _this.nodes) {
      var node = _this.nodes[key];
      if (node.type == "switch" || node.type == "ovs") {
        if (_this.positions_cache &&
            _this.positions_cache[key] &&
            _this.positions_cache[key][2]) {
          node.customize = _this.positions_cache[key][2];
        } else {
          node.customize = "NoName" + node.index;
        }
        switches.push(node);
      }
    }
    return switches;
  };

  this.get_all_ports_in_switch = function(id) {
    var node = _this.nodes[id];
    var ports = [];
    for (var key in node.connectors) {
      if (key.split(':')[2] != 'LOCAL') {
        ports.push(node.connectors[key]);
      }
    }
    return ports;
  };

  // Switch nodes filter
  var filteredNodes = [];
  d3.values(this.nodes).forEach(function(node) {
    if (node.type !== "port") {
      filteredNodes.push(node);
    }
  });

  // Compute the distinct nodes from the links.
  this.links.forEach(function(link) {
    link.source = nodes[link.source] || (nodes[link.source] = {
      name: link.source
    });
    link.target = nodes[link.target] || (nodes[link.target] = {
      name: link.target
    });
  });

  this.ports = [];

  var filteredLinks = [];
  this.links.forEach(function(link, index) {
    if (link.type === "link" || link.type === "host") {
      // Make source always less than target
      // if (link.source.id > link.target.id) {
      //   var tmp = link.source;
      //   link.source = link.target;
      //   link.target = tmp;
      // }
      if (link.source.type === "port") {
        link.source_port = link.source;
        link.source = nodes[link.source.id.split(':').slice(0, 2).join(':')];
      }
      if (link.target.type === "port") {
        link.target_port = link.target;
        _this.ports.push(link.target_port);
        link.target = nodes[link.target.id.split(':').slice(0, 2).join(':')];
      }
      link.id = index;
      filteredLinks.push(link);
    }
  });

  filteredLinks.sort(function(a, b) {
    if (a.source.id > b.source.id) {
      return 1;
    } else if (a.source.id < b.source.id) {
      return -1;
    } else {
      if (a.target.id > b.target.id) {
        return 1;
      } else if (a.target.id < b.target.id) {
        return -1;
      } else {
        return 0;
      }
    }
  });

  var begin = null;
  for (var i=0; i<filteredLinks.length; i++) {
    if (i != 0 &&
        filteredLinks[i].source.id == filteredLinks[i-1].source.id &&
        filteredLinks[i].target.id == filteredLinks[i-1].target.id) {
      // NOOP
    } else {
      if (begin != null) {
        var linknum = i - begin;
        for (var j=begin; j<i; j++) {
          filteredLinks[j].theta = (linknum - 1 - 2*j + 2*begin) * THETA / 2;
        }
      }
      begin = i;
    }
  }
  if (begin) {
    var linknum = i - begin;
    for (var j=begin; j<i; j++) {
      filteredLinks[j].theta = (linknum - 1 - 2*j + 2*begin) * THETA / 2;
    }
  }

  this.force = d3.layout.force()
  //  .nodes(d3.values(this.nodes))
  //  .links(this.links)
    .nodes(filteredNodes)
    .links(filteredLinks)
    .size([this.width, this.height])
    .gravity(1.0)
    .linkStrength(function(d) {
      return strength[d.type];
    })
    .linkDistance(function(d) {
      return distance[d.type];
    })
    .charge( /**function(d) { return charge[d.type]; }**/ -20000)
    .friction(0.7)
    .on("tick", tick)
    .start();

  this.dragstart = function(d, i) {
    d3.event.sourceEvent.stopPropagation();
    _this.force.stop();
  };

  this.dragmove = function(d, i) {
    d.px += d3.event.dx;
    d.py += d3.event.dy;
    d.x += d3.event.dx;
    d.y += d3.event.dy;

    for (var key in d['connectors']) {
      port = _this.nodes[key];
      port.px += d3.event.dx;
      port.py += d3.event.dy;
      port.x += d3.event.dx;
      port.y += d3.event.dy;
      tick();
    }
    tick();
  };

  this.dragend = function(d, i) {
    if (_this.fix_layout)
      d.fixed = true;
    tick();
    _this.force.resume();
  };

  this.custom_drag = d3.behavior.drag()
    .on("dragstart", this.dragstart)
    .on("drag", this.dragmove)
    .on("dragend", this.dragend);

  this.svg = d3.select(this.div).append("svg")
    .attr("width", this.width)
    .attr("height", this.height)
    .on("dblclick", this.fadeout_all)
    .attr("pointer-events", "all")
    .call(d3.behavior.zoom().on("zoom", rescale))
    .on("dblclick.zoom", null)
    .append('svg:g');

  this.defs = this.svg.append('defs');

  this.defs.append('pattern')
    .attr('id', 'mellanox')
    .attr('patternUnits', 'userSpaceOnUse')
    .attr('x', -55)
    .attr('y', -55)
    .attr('width', 110)
    .attr('height', 110)
    .append("image")
    .attr("xlink:href", "/static/assets/images/mellanox.jpg")
    .attr('width', 110)
    .attr('height', 110);

  this.defs.append('pattern')
    .attr('id', 'arista')
    .attr('patternUnits', 'userSpaceOnUse')
    .attr('x', -55)
    .attr('y', -55)
    .attr('width', 110)
    .attr('height', 110)
    .append("image")
    .attr("xlink:href", "/static/assets/images/arista.png")
    .attr('width', 110)
    .attr('height', 110);

  this.defs.append('pattern')
    .attr('id', 'dell')
    .attr('patternUnits', 'userSpaceOnUse')
    .attr('x', -55)
    .attr('y', -55)
    .attr('width', 110)
    .attr('height', 110)
    .append("image")
    .attr("xlink:href", "/static/assets/images/dell.png")
    .attr('width', 110)
    .attr('height', 110)
    .attr('fill', 'black');

  this.defs.append('pattern')
    .attr('id', 'pica8')
    .attr('patternUnits', 'userSpaceOnUse')
    .attr('x', -55)
    .attr('y', -55)
    .attr('width', 110)
    .attr('height', 110)
    .append("image")
    .attr("xlink:href", "/static/assets/images/pica8.png")
    .attr('width', 110)
    .attr('height', 110)
    .attr('fill', 'black');

  this.defs.append('pattern')
    .attr('id', 'juniper')
    .attr('patternUnits', 'userSpaceOnUse')
    .attr('x', -55)
    .attr('y', -55)
    .attr('width', 110)
    .attr('height', 110)
    .append("image")
    .attr("xlink:href", "/static/assets/images/juniper.png")
    .attr('width', 110)
    .attr('height', 110)
    .attr('fill', 'black');

  this.link = this.svg.selectAll(".link")
    .data(this.force.links())
    .enter().append("path")
    .attr("class", function(d) {
      return "transparent-link" +
        " link-id-" + d.id +
        ((d.type === "link" || d.type === "host") ?
         (
           d.source.type === "host" ?
             " link-" + d.source.id +
             " link-" + d.source['host-tracker-service:addresses'][0].ip :
             " link-" + d.source_port.id
         ) + (
           d.target.type === "host" ?
             " link-" + d.target.id +
             " link-" + d.target['host-tracker-service:addresses'][0].ip :
             " link-" + d.target_port.id
         ) : "");
    })
    .style("opacity", 1.0)
    .on("click", onclick)
    .on("mouseover", function() {
      if (!lock_highlight) {
        var data = d3.select(this)[0][0].__data__;
        _this.highlight_link(data);
      }
    })
    .on("mouseout", function() {
      if (!lock_highlight) {
        var data = d3.select(this)[0][0].__data__;
        _this.fadeout_all();
      }
    });

  this.show_link = this.svg.selectAll(".link")
    .data(this.force.links())
    .enter().append("path")
    .attr('pointer-events', 'all')
    .attr("class", function(d) {
      return d.type + "-link" +
        " " + d.capacity + "-link" +
        " link-id-" + d.id +
        ((d.type === "link" || d.type === "host") ?
         (
           d.source.type === "host" ?
             " link-" + d.source.id +
             " link-" + d.source['host-tracker-service:addresses'][0].ip :
             " link-" + d.source_port.id
         ) + (
           d.target.type === "host" ?
             " link-" + d.target.id +
             " link-" + d.target['host-tracker-service:addresses'][0].ip :
             " link-" + d.target_port.id
         ) : "");
    });

  this.node = this.svg.selectAll(".node")
    .data(this.force.nodes())
    .enter().append("g")
    .attr("class", function(d) {
      return "node" + " " + d.type + " " + d.type + '-' + d.id;
    })
    .on("click", onclick)
  //    .on("mouseout", mouseout)
    .call(this.custom_drag);

  this.port = this.svg.selectAll(".port")
    .data(this.ports)
    .enter().append("g")
    .attr("class", function(d) {
      return d.type + " " + d.type + "-" + d.id;
    });

  function tick() {
    var seenPort = {};

    _this.link
      .attr("d", function(d) {
        var linedata = [[d.source.x, d.source.y]];
        var linelen = Math.sqrt(Math.pow(d.target.y - d.source.y, 2) + Math.pow(d.target.x - d.source.x, 2));
        // Distribute switch ports
        if (d.source_port) {
          if (!seenPort[d.source_port.id]) {
            d.source_port.x = d.source.x + ((d.target.x - d.source.x) * Math.cos(d.theta) - (d.target.y - d.source.y) * Math.sin(d.theta)) * size.switch / linelen;
            d.source_port.y = d.source.y + ((d.target.x - d.source.x) * Math.sin(d.theta) + (d.target.y - d.source.y) * Math.cos(d.theta)) * size.switch / linelen;
            seenPort[d.source_port.id] = true;
          }
          linedata.push([d.source_port.x, d.source_port.y]);
        }
        if (d.target_port) {
          if (!seenPort[d.target_port.id]) {
            d.target_port.x = d.target.x + ((d.source.x - d.target.x) * Math.cos(-d.theta) - (d.source.y - d.target.y) * Math.sin(-d.theta)) * size.switch / linelen;
            d.target_port.y = d.target.y + ((d.source.x - d.target.x) * Math.sin(-d.theta) + (d.source.y - d.target.y) * Math.cos(-d.theta)) * size.switch / linelen;
            seenPort[d.target_port.id] = true;
          }
          linedata.push([d.target_port.x, d.target_port.y]);
        }
        linedata.push([d.target.x, d.target.y]);
        return pathgen(linedata);
      });

    _this.show_link
      .attr("d", function(d) {
        var linedata = [[d.source.x, d.source.y]];
        if (d.source_port) {
          linedata.push([d.source_port.x, d.source_port.y]);
        }
        if (d.target_port) {
          linedata.push([d.target_port.x, d.target_port.y]);
        }
        linedata.push([d.target.x, d.target.y]);
        return pathgen(linedata);
      });

    _this.node
      .attr("transform", function(d) {
        return "translate(" + d.x + "," + d.y + ")";
      });

    _this.port
      .attr("transform", function(d) {
        return "translate(" + d.x + "," + d.y + ")";
      });
  }

  function onclick() {
    var element = d3.select(this);
    var data = element[0][0].__data__;
    if (data.capacity) {
      _this.highlight_link(data);
      _this.show_link_details(data);
    } else if (data.type == "switch" || data.type == "ovs") {
      _this.highlight_switch(data);
    } else if (data.type == "port") {
      _this.highlight_port(data);
    } else if (data.type == "host") {
      _this.highlight_host(data);
    }
  }

  function rescale() {
    if (_this.zoom)
      _this.svg
      .attr("transform", "translate(" + d3.event.translate + ")" + " scale(" + d3.event.scale + ")");
  }

  d3.select(window).on("resize", resize);

  function resize() {
    _this.width = $(_this.div).parent().width();
    _this.height = $(window).height() - 75;
    $(_this.div).attr("width", _this.width).attr("height", _this.height);
    $(_this.div).children().attr("width", _this.width).attr("height", _this.height);
    _this.svg.attr("width", _this.width).attr("height", _this.height);
    _this.force.size([_this.width, _this.height]).resume();
  }

  this.node.append("circle")
    .attr('pointer-events', 'all')
    .attr("class", function(d) {
      if (d['manufacturer'] && d['manufacturer'].match(/mellanox/gi)) {
        return "mellanox-circle";
      }
      else if (d['manufacturer'] && d['manufacturer'].match(/dell/gi)) {
        return "dell-circle";
      }
      else if (d['manufacturer'] && d['manufacturer'].match(/pic/gi)) {
        return "pic-circle";
      }
      else if (d['manufacturer'] && d['manufacturer'].match(/juniper/gi)) {
        return "juniper-circle";
      }
      else {
        return d['type'] + "-circle";
      }
    })
    .attr("r", function(d) {
      return size[d.type];
    });

  d3.selectAll(".host")
    .append("text")
    .attr('text-anchor', 'middle')
    .attr('dominant-baseline', 'central')
    .attr('font-family', 'FontAwesome')
    .attr('font-size', function(d) {
      return 2 * size[d.type];
    })
    .style('fill', 'white')
    .text(function(d) {
      return '\uf233';
    });

  this.port.append("circle")
    .attr('pointer-events', 'all')
    .attr("class", function(d) {
      return d['type'] + "-circle";
    })
    .attr("r", function(d) {
      return size[d.type];
    });


  for (var i = 10000000/**tick_times * tick_times * tick_times * tick_times**/; i > 0; --i) this.force.tick();
  this.force.stop();

  this.show_switch_labels(this.switch_labels_type);
  this.show_host_labels(this.host_labels_type);
  this.show_port_labels("port_number");
};
