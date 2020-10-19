import { HttpClient } from '@angular/common/http';
import { Component, OnInit } from '@angular/core';
import * as jsnx from 'jsnetworkx';
import * as d3 from 'd3';

@Component({
  selector: 'app-network-map',
  templateUrl: './network-map.component.html',
  styleUrls: ['./network-map.component.css']
})
export class NetworkMapComponent implements OnInit {

  senderNodesArray = [];
  recipientNodesArray = [];
  edgesArray = []

  color;

  constructor(private http: HttpClient) { }

  ngOnInit() {

    this.http.get('../assets/db.json').subscribe(data => {
      console.log(data);
      for (let i = 0; i < data['data'].length; i++) {
        this.senderNodesArray.push(data['data'][i]['sender'][0]);
        this.recipientNodesArray.push(data['data'][i]['toRecipients'][0]);
        this.edgesArray.push([data['data'][i]['sender'][0], data['data'][i]['toRecipients'][0]]);
      }

      let sentimentScore = [];
      for (let i = 0; i < data['data'].length; i++) {
        sentimentScore.push(data['data'][i]['senti_score'][0]['score'].toFixed(2));
      }

      var counts = {};
      var counts2 = {};
      for (var i = 0; i < this.senderNodesArray.length; i++) {
        counts[this.senderNodesArray[i]] = 1 + (counts[this.senderNodesArray[i]] || 0);
        counts2[this.recipientNodesArray[i]] = 1 + (counts[this.recipientNodesArray[i]] || 0);
      }

      var graph = new jsnx.DiGraph();
      for (let i = 0; i < this.senderNodesArray.length; i++) {
        graph.addNode(this.senderNodesArray[i], { id: data['data'][i]['id'], endpoint: 'Recipient : ' + data['data'][i]['toRecipients'][0], traffic: counts[data['data'][i]['sender'][0]], colour: this.color, senti_score: sentimentScore[i] });
        graph.addNode(this.recipientNodesArray[i], { id: data['data'][i]['id'], endpoint: 'Sender : ' + data['data'][i]['sender'][0], traffic: counts2[data['data'][i]['toRecipients'][0]], colour: this.color, senti_score: sentimentScore[i] })
      }

      for (let i = 0; i < this.edgesArray.length; i++) {
        if (sentimentScore[i] < 0) {
          this.color = 'red';
        }
        else if (sentimentScore[i] > 0) {
          this.color = 'green';
        }
        else {
          this.color = 'orange';
        }
        graph.addEdge(this.edgesArray[i][0], this.edgesArray[i][1], { id: this.edgesArray[i][0], colour: this.color, traffic: counts[data['data'][i]['sender'][0]] })
      }

      function getRandomColor() {
        var letters = '0123456789ABCDEF';
        var color = '#';
        for (var i = 0; i < 6; i++) {
          color += letters[Math.floor(Math.random() * 16)];
        }
        return color;
      }

      jsnx.draw(graph, {
        element: '#graph-canvas',
        withLabels: false,
        withEdgeLabels: true,
        nodeStyle: {
          fill: function (d) {
            return getRandomColor();
          }
        },
        nodeAttr: {
          r: function (d) {
            let radius = d.data.traffic * 5;
            if (radius > 20) {
              radius = 20;
            }
            return radius;
          }
        },
        edgeLabels: function (d) {
          return d.data.id;
        },
        edgeStyle: {
          fill: function (d) {
            return d.data.colour;
          },
          'stroke-width': function (d) {
            let stroke_width = d.data.traffic * 5;
            if (stroke_width > 10) {
              stroke_width = 10;
            }
            return stroke_width;
          }
        },
        labelStyle: { fill: 'white' },
        stickyDrag: false
      });

      d3.selectAll('.node').on('click', function (d) {
        div.transition()
          .duration(200)
          .style("opacity", .9);
        div.html("User ID : " + d.data.id + "<br />" + d.data.endpoint + "<br />Email Amount : " + d.data.traffic + "<br />Sentiment : " + d.data.senti_score)
          .style("left", (d3.event.pageX) + "px")
          .style("top", (d3.event.pageY - 180) + "px")
          .style("color", "white")
          .style("width", "500px")
          .style("overflow", "hidden");
      }).on('mouseout', function (d) {
        div.style("opacity", "0")
      }).on('mousemove', function (d) {
        div.style("opacity", "0")
      })

      let div = d3.select("#graph-canvas").append("div")
        .attr("class", "tooltip")
        .style("opacity", 0)
        .style("position", "absolute")
        .style("cursor", "pointer")
        .style("background-color", "rgb(172, 60, 16)")
        .style("padding", "15px")
        .style("border-radius", "5px")
        .style("max-width", "500px");
    })

    function updateWindow() {
      let x = window.innerWidth || document.documentElement.clientWidth || document.getElementsByTagName('body')[0].clientWidth;
      let y = window.innerHeight || document.documentElement.clientHeight || document.getElementsByTagName('body')[0].clientHeight;
      let svg = d3.select("svg")
      svg.attr("width", x).attr("height", y);
    }
    updateWindow();
    d3.select(window).on('resize.updatesvg', updateWindow);
  }

}
