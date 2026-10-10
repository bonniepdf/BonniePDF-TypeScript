// GENERATED from spec/fixtures/document-definition (spec 15 §15). Do not edit.
// Regenerate with `node schema/sync.mjs` in the specification repository.
export const DEFINITION_FIXTURES: Record<'valid' | 'invalid' | 'unrepresentable' | 'settings-rules', Record<string, any>> = {
  "valid": {
    "defaults-equivalence": {
      "_fixture": {
        "id": "document-definition/valid/defaults-equivalence",
        "description": "Two spacers, one stating Spacer's defaults and one omitting them; a stack stating VerticalStack's default spacing. Both cores read them to the same document, and the canonical write omits every value equal to its spec default (15 §3.3).",
        "spec": "15 §3.3, §14; 03 §1"
      },
      "_expect": {
        "canonical": {
          "version": 1,
          "minorVersion": 0,
          "pages": [
            {
              "content": [
                {
                  "type": "VerticalStack",
                  "children": [
                    {
                      "type": "Spacer"
                    },
                    {
                      "type": "Spacer"
                    }
                  ]
                }
              ]
            }
          ]
        },
        "pdfSha256": null
      },
      "version": 1,
      "minorVersion": 0,
      "settings": {
        "pageSize": "a4",
        "orientation": "portrait",
        "margin": 50
      },
      "pages": [
        {
          "content": [
            {
              "type": "VerticalStack",
              "spacing": 0,
              "breakAllowed": true,
              "margin": 0,
              "children": [
                {
                  "type": "Spacer",
                  "height": 0
                },
                {
                  "type": "Spacer"
                }
              ]
            }
          ]
        }
      ]
    },
    "font-features": {
      "_fixture": {
        "id": "document-definition/valid/font-features",
        "description": "OpenType features survive text-element and nested TextStyle round trips.",
        "spec": "19"
      },
      "_expect": {
        "pages": 1,
        "roundTrip": true
      },
      "version": 1,
      "minorVersion": 0,
      "pages": [
        {
          "content": [
            {
              "type": "TextBlock",
              "text": "office AV",
              "fontFeatures": {
                "liga": 0,
                "kern": 0
              }
            },
            {
              "type": "RichText",
              "spans": [
                {
                  "text": "office",
                  "style": {
                    "fontFeatures": {
                      "smcp": 1
                    }
                  }
                }
              ]
            }
          ]
        }
      ]
    },
    "minimal": {
      "_fixture": {
        "id": "document-definition/valid/minimal",
        "description": "The smallest legal definition: version stamps and one page with one paragraph. Everything else takes its default on read. Pins that settings, metadata and resources are optional and that `pages[0]` is the document's auto-created first page.",
        "spec": "15 §2, §7"
      },
      "_expect": {
        "pages": 1,
        "text": [
          "Hello"
        ],
        "roundTrip": true,
        "canonical": {
          "version": 1,
          "minorVersion": 0,
          "pages": [
            {
              "content": [
                {
                  "type": "TextBlock",
                  "text": "Hello"
                }
              ]
            }
          ]
        },
        "pdfSha256": null
      },
      "version": 1,
      "minorVersion": 0,
      "pages": [
        {
          "content": [
            {
              "type": "TextBlock",
              "text": "Hello"
            }
          ]
        }
      ]
    },
    "page-chrome": {
      "_fixture": {
        "id": "document-definition/valid/page-chrome",
        "description": "Declarative page chrome. The footer has a default plus an even-page override; the header has only a first-page element. For page n the element is the first present of firstPage (n = 1), odd/even, default (15 §5.1). Three pages of content force pages 2 and 3 to exist.",
        "spec": "15 §5.1; 01 §4",
        "requires": "prerequisite P1 (pageTemplate factory, 01 §4.0): built in both cores"
      },
      "_expect": {
        "pages": 3,
        "chrome": {
          "header": {
            "1": "Northwind — Confidential",
            "2": null,
            "3": null
          },
          "footer": {
            "1": "Page 1 of 3",
            "2": "Even: 2 / 3",
            "3": "Page 3 of 3"
          }
        },
        "pdfSha256": null,
        "canonical": {
          "version": 1,
          "minorVersion": 0,
          "settings": {
            "pageChrome": {
              "header": {
                "firstPage": {
                  "type": "TextBlock",
                  "text": "Northwind — Confidential",
                  "alignment": "right"
                }
              },
              "footer": {
                "default": {
                  "type": "TextBlock",
                  "text": "Page {{CurrentPage}} of {{TotalPages}}",
                  "alignment": "center"
                },
                "even": {
                  "type": "TextBlock",
                  "text": "Even: {{CurrentPage}} / {{TotalPages}}",
                  "alignment": "center"
                }
              }
            }
          },
          "pages": [
            {
              "content": [
                {
                  "type": "TextBlock",
                  "text": "First"
                }
              ]
            },
            {
              "content": [
                {
                  "type": "TextBlock",
                  "text": "Second"
                }
              ]
            },
            {
              "content": [
                {
                  "type": "TextBlock",
                  "text": "Third"
                }
              ]
            }
          ]
        }
      },
      "version": 1,
      "minorVersion": 0,
      "settings": {
        "pageChrome": {
          "header": {
            "firstPage": {
              "type": "TextBlock",
              "text": "Northwind — Confidential",
              "alignment": "right"
            }
          },
          "footer": {
            "default": {
              "type": "TextBlock",
              "text": "Page {{CurrentPage}} of {{TotalPages}}",
              "alignment": "center"
            },
            "even": {
              "type": "TextBlock",
              "text": "Even: {{CurrentPage}} / {{TotalPages}}",
              "alignment": "center"
            }
          }
        }
      },
      "pages": [
        {
          "content": [
            {
              "type": "TextBlock",
              "text": "First"
            }
          ]
        },
        {
          "content": [
            {
              "type": "TextBlock",
              "text": "Second"
            }
          ]
        },
        {
          "content": [
            {
              "type": "TextBlock",
              "text": "Third"
            }
          ]
        }
      ]
    },
    "preserve-whitespace": {
      "_fixture": {
        "id": "document-definition/valid/preserve-whitespace",
        "description": "A TextBlock with preserveWhitespace true, and one stating the default false. Both cores read both; the canonical write keeps the key only where it differs from its spec default (15 §3.3).",
        "spec": "15 §3.3, §7; 03 TextBlock 'Preserved whitespace'"
      },
      "_expect": {
        "pages": 1,
        "roundTrip": true,
        "canonical": {
          "version": 1,
          "minorVersion": 0,
          "pages": [
            {
              "content": [
                {
                  "type": "TextBlock",
                  "text": "    indented",
                  "preserveWhitespace": true
                },
                {
                  "type": "TextBlock",
                  "text": "plain"
                }
              ]
            }
          ]
        },
        "pdfSha256": null
      },
      "version": 1,
      "minorVersion": 0,
      "pages": [
        {
          "content": [
            {
              "type": "TextBlock",
              "text": "    indented",
              "preserveWhitespace": true
            },
            {
              "type": "TextBlock",
              "text": "plain",
              "preserveWhitespace": false
            }
          ]
        }
      ]
    },
    "removed-chart-options": {
      "_fixture": {
        "id": "document-definition/valid/removed-chart-options",
        "description": "Removed chart options warn as unknown keys in ordinary reads and fail strict validation; effective defaults remain supported.",
        "spec": "15 §8.9, §12.4"
      },
      "_expect": {
        "pages": 1
      },
      "_expectWarnings": [
        {
          "path": "/pages/0/content/0/lineWidth",
          "code": "unknown-key"
        },
        {
          "path": "/pages/0/content/0/showDataPointMarkers",
          "code": "unknown-key"
        },
        {
          "path": "/pages/0/content/1/dotRadius",
          "code": "unknown-key"
        },
        {
          "path": "/pages/0/content/2/stemWidth",
          "code": "unknown-key"
        },
        {
          "path": "/pages/0/content/2/headRadius",
          "code": "unknown-key"
        },
        {
          "path": "/pages/0/content/3/totalLabelFontSize",
          "code": "unknown-key"
        },
        {
          "path": "/pages/0/content/3/totalValueFontSize",
          "code": "unknown-key"
        }
      ],
      "version": 1,
      "minorVersion": 0,
      "pages": [
        {
          "content": [
            {
              "type": "LineChart",
              "width": 150,
              "height": 100,
              "data": {
                "series": [
                  {
                    "dataPoints": [
                      {
                        "label": "A",
                        "value": 1
                      }
                    ]
                  }
                ]
              },
              "lineWidth": 9,
              "showDataPointMarkers": false
            },
            {
              "type": "DotPlotChart",
              "width": 150,
              "height": 100,
              "data": {
                "series": [
                  {
                    "dataPoints": [
                      {
                        "label": "A",
                        "value": 1
                      }
                    ]
                  }
                ]
              },
              "dotRadius": 9
            },
            {
              "type": "LollipopChart",
              "width": 150,
              "height": 100,
              "data": {
                "series": [
                  {
                    "dataPoints": [
                      {
                        "label": "A",
                        "value": 1
                      }
                    ]
                  }
                ]
              },
              "stemWidth": 9,
              "headRadius": 9
            },
            {
              "type": "PieChart",
              "width": 150,
              "height": 100,
              "data": {
                "series": [
                  {
                    "dataPoints": [
                      {
                        "label": "A",
                        "value": 1
                      }
                    ]
                  }
                ]
              },
              "totalLabelFontSize": 9,
              "totalValueFontSize": 9
            }
          ]
        }
      ]
    },
    "report-table-chart": {
      "_fixture": {
        "id": "document-definition/valid/report-table-chart",
        "description": "A one-page report. Pins: palette tokens and hex colours; length tokens ('2cm') normalising to points on write; all four spacing forms; table sugar (columns/header/rows/footer, a string cell, a TableCell object with columnSpan); a LineChart with data, axis and series style; node ids; PDF/A-2a with PDF/UA-1.",
        "spec": "15 §3, §8.6, §8.9, §4.1"
      },
      "_expect": {
        "pages": 1,
        "ids": [
          "title",
          "summary",
          "revenue",
          "revenue-trend"
        ],
        "canonicalLengths": {
          "/pages/0/content/0/margin": {
            "bottom": 12
          },
          "/settings/margin": 56.693
        },
        "roundTrip": true,
        "pdfSha256": null,
        "canonical": {
          "version": 1,
          "minorVersion": 0,
          "settings": {
            "margin": 56.69291338582677,
            "conformance": "pdf/a-2a",
            "accessibility": "pdf/ua-1",
            "language": "en-GB",
            "defaultTextStyle": {
              "fontFamily": "Helvetica",
              "fontSize": 11,
              "color": "#314158"
            }
          },
          "metadata": {
            "title": "Quarterly Revenue Report",
            "author": "Northwind Analytics"
          },
          "pages": [
            {
              "content": [
                {
                  "type": "Heading",
                  "id": "title",
                  "margin": {
                    "bottom": 12
                  },
                  "fontSize": 24,
                  "text": "Quarterly Revenue Report",
                  "tocIdentifier": "title"
                },
                {
                  "type": "TextBlock",
                  "id": "summary",
                  "margin": {
                    "top": 8,
                    "bottom": 8
                  },
                  "text": "Revenue grew in every operating region."
                },
                {
                  "type": "Table",
                  "id": "revenue",
                  "border": 0.5,
                  "borderColors": {
                    "top": "#cad5e2",
                    "right": "#cad5e2",
                    "bottom": "#cad5e2",
                    "left": "#cad5e2"
                  },
                  "columns": [
                    2,
                    1,
                    1
                  ],
                  "header": [
                    [
                      "Region",
                      "Revenue",
                      "Growth"
                    ]
                  ],
                  "rows": [
                    [
                      "North America",
                      "$4.2m",
                      "12%"
                    ],
                    [
                      "Europe",
                      "$3.1m",
                      "9%"
                    ]
                  ],
                  "footer": [
                    [
                      {
                        "type": "TableCell",
                        "content": "Total: $7.3m",
                        "columnSpan": 3
                      }
                    ]
                  ],
                  "cellPadding": 6,
                  "headerBackgroundColor": "#e2e8f0"
                },
                {
                  "type": "Spacer",
                  "height": 17.007874015748033
                },
                {
                  "type": "LineChart",
                  "id": "revenue-trend",
                  "data": {
                    "series": [
                      {
                        "name": "Northwind",
                        "color": "#4f39f6",
                        "dataPoints": [
                          {
                            "label": "Q1",
                            "value": 3.1
                          },
                          {
                            "label": "Q2",
                            "value": 3.5
                          },
                          {
                            "label": "Q3",
                            "value": 3.9
                          },
                          {
                            "label": "Q4",
                            "value": 4.2
                          }
                        ]
                      }
                    ]
                  },
                  "title": "Revenue by quarter",
                  "width": 480,
                  "height": 240,
                  "altText": "Revenue rose in every quarter of 2026, from $3.1m to $4.2m.",
                  "yAxis": {
                    "prefix": "$",
                    "suffix": "m",
                    "maxValue": 5
                  }
                }
              ]
            }
          ]
        }
      },
      "$schema": "https://bonniepdf.dev/schema/document-definition/1.0.json",
      "version": 1,
      "minorVersion": 0,
      "settings": {
        "pageSize": "a4",
        "margin": "2cm",
        "conformance": "pdf/a-2a",
        "accessibility": "pdf/ua-1",
        "language": "en-GB",
        "defaultTextStyle": {
          "fontFamily": "Helvetica",
          "fontSize": 11,
          "color": "slate-700"
        }
      },
      "metadata": {
        "title": "Quarterly Revenue Report",
        "author": "Northwind Analytics"
      },
      "pages": [
        {
          "content": [
            {
              "type": "Heading",
              "id": "title",
              "text": "Quarterly Revenue Report",
              "level": 1,
              "tocIdentifier": "title",
              "fontSize": 24,
              "margin": {
                "bottom": 12
              }
            },
            {
              "type": "TextBlock",
              "id": "summary",
              "text": "Revenue grew in every operating region.",
              "margin": [
                0,
                8
              ]
            },
            {
              "type": "Table",
              "id": "revenue",
              "columns": [
                2,
                1,
                1
              ],
              "cellPadding": 6,
              "border": {
                "width": 0.5,
                "color": "slate-300"
              },
              "headerBackgroundColor": "#e2e8f0",
              "header": [
                [
                  "Region",
                  "Revenue",
                  "Growth"
                ]
              ],
              "rows": [
                [
                  "North America",
                  "$4.2m",
                  "12%"
                ],
                [
                  "Europe",
                  "$3.1m",
                  "9%"
                ]
              ],
              "footer": [
                [
                  {
                    "type": "TableCell",
                    "content": "Total: $7.3m",
                    "columnSpan": 3
                  }
                ]
              ]
            },
            {
              "type": "Spacer",
              "height": "6mm"
            },
            {
              "type": "LineChart",
              "id": "revenue-trend",
              "title": "Revenue by quarter",
              "altText": "Revenue rose in every quarter of 2026, from $3.1m to $4.2m.",
              "width": 480,
              "height": 240,
              "yAxis": {
                "prefix": "$",
                "suffix": "m",
                "minValue": 0,
                "maxValue": 5,
                "stepCount": 5
              },
              "data": {
                "series": [
                  {
                    "name": "Northwind",
                    "color": "indigo-600",
                    "style": {
                      "lineWidth": 2,
                      "showMarkers": true
                    },
                    "dataPoints": [
                      {
                        "label": "Q1",
                        "value": 3.1
                      },
                      {
                        "label": "Q2",
                        "value": 3.5
                      },
                      {
                        "label": "Q3",
                        "value": 3.9
                      },
                      {
                        "label": "Q4",
                        "value": 4.2
                      }
                    ]
                  }
                ]
              }
            }
          ]
        }
      ]
    },
    "rich-text-and-lists": {
      "_fixture": {
        "id": "document-definition/valid/rich-text-and-lists",
        "description": "RichText spans with per-span TextStyle (which uses `color`, as a text element does: 15 §8.2), a structural line break as opposed to a raw \\n inside a span, and a list holding two string items and a nested list of the same type (a list's items are strings or nested lists of the same type: 15 §8.5).",
        "spec": "15 §8.4, §8.5; 03 RichText"
      },
      "_expect": {
        "pages": 1,
        "roundTrip": true,
        "pdfSha256": null,
        "canonical": {
          "version": 1,
          "minorVersion": 0,
          "pages": [
            {
              "content": [
                {
                  "type": "RichText",
                  "spans": [
                    {
                      "text": "Total due: "
                    },
                    {
                      "text": "$1,240.00",
                      "style": {
                        "fontWeight": "bold",
                        "color": "#c10007"
                      }
                    },
                    {
                      "lineBreak": true
                    },
                    {
                      "text": "Pay within 30 days.\nThank you."
                    }
                  ],
                  "defaultStyle": {
                    "fontSize": 12
                  }
                },
                {
                  "type": "UnorderedList",
                  "items": [
                    "A plain item",
                    "Another item",
                    {
                      "type": "UnorderedList",
                      "items": [
                        "nested one",
                        "nested two"
                      ],
                      "bulletStyle": "circle"
                    }
                  ],
                  "bulletStyle": "dash"
                }
              ]
            }
          ]
        }
      },
      "version": 1,
      "minorVersion": 0,
      "pages": [
        {
          "content": [
            {
              "type": "RichText",
              "defaultStyle": {
                "fontSize": 12
              },
              "spans": [
                {
                  "text": "Total due: "
                },
                {
                  "text": "$1,240.00",
                  "style": {
                    "fontWeight": "bold",
                    "color": "red-700"
                  }
                },
                {
                  "lineBreak": true
                },
                {
                  "text": "Pay within 30 days.\nThank you."
                }
              ]
            },
            {
              "type": "UnorderedList",
              "bulletStyle": "dash",
              "items": [
                "A plain item",
                "Another item",
                {
                  "type": "UnorderedList",
                  "bulletStyle": "circle",
                  "items": [
                    "nested one",
                    "nested two"
                  ]
                }
              ]
            }
          ]
        }
      ]
    },
    "rotation-geometry": {
      "_fixture": {
        "id": "document-definition/valid/rotation-geometry",
        "description": "Shared four-corner bounds for cardinal and cancelling nested turns.",
        "spec": "17"
      },
      "_expect": {
        "pages": 1,
        "roundTrip": true,
        "rectangles": [
          {
            "id": "clockwise-box",
            "x": 10,
            "y": 10,
            "width": 20,
            "height": 80
          },
          {
            "id": "counterclockwise-box",
            "x": 10,
            "y": 90,
            "width": 20,
            "height": 80
          },
          {
            "id": "nested-box",
            "x": 10,
            "y": 170,
            "width": 80,
            "height": 20
          }
        ],
        "contentStreamSha256": "9cbcbe9c369b335bfeb1ff8b706f3173ec865161e8059a28d402f327cbaf9a6e"
      },
      "version": 1,
      "minorVersion": 0,
      "settings": {
        "margin": 10
      },
      "pages": [
        {
          "content": [
            {
              "type": "Rotate",
              "angle": 90,
              "mode": "constrained",
              "contentWidth": 80,
              "child": {
                "type": "Container",
                "id": "clockwise-box",
                "width": 80,
                "height": 20,
                "backgroundColor": "#44aa88"
              }
            },
            {
              "type": "Rotate",
              "angle": -90,
              "mode": "constrained",
              "contentWidth": 80,
              "child": {
                "type": "Container",
                "id": "counterclockwise-box",
                "width": 80,
                "height": 20,
                "backgroundColor": "#44aa88"
              }
            },
            {
              "type": "Rotate",
              "angle": 30,
              "contentWidth": 80,
              "child": {
                "type": "Rotate",
                "angle": -30,
                "contentWidth": 80,
                "child": {
                  "type": "Container",
                  "id": "nested-box",
                  "width": 80,
                  "height": 20,
                  "backgroundColor": "#44aa88"
                }
              }
            }
          ]
        }
      ]
    },
    "rotation": {
      "_fixture": {
        "id": "document-definition/valid/rotation",
        "description": "Native rotations, quarter turns and nested free rotations.",
        "spec": "17"
      },
      "_expect": {
        "pages": 1,
        "text": [
          "Clockwise",
          "Counterclockwise",
          "Angled",
          "Nested"
        ],
        "roundTrip": true
      },
      "version": 1,
      "minorVersion": 0,
      "pages": [
        {
          "content": [
            {
              "type": "Rotate",
              "angle": 90,
              "mode": "constrained",
              "contentWidth": 100,
              "child": {
                "type": "TextBlock",
                "text": "Clockwise"
              }
            },
            {
              "type": "Rotate",
              "angle": -90,
              "mode": "constrained",
              "contentWidth": 100,
              "child": {
                "type": "TextBlock",
                "text": "Counterclockwise"
              }
            },
            {
              "type": "Rotate",
              "angle": 25,
              "contentWidth": 100,
              "margin": 10,
              "child": {
                "type": "TextBlock",
                "text": "Angled"
              }
            },
            {
              "type": "Rotate",
              "angle": 30,
              "contentWidth": 100,
              "child": {
                "type": "Rotate",
                "angle": -30,
                "contentWidth": 100,
                "child": {
                  "type": "TextBlock",
                  "text": "Nested"
                }
              }
            }
          ]
        }
      ]
    },
    "transforms": {
      "_fixture": {
        "id": "document-definition/valid/transforms",
        "description": "Native mirror and translate with composed cardinal rotation.",
        "spec": "18"
      },
      "_expect": {
        "contentStreamSha256": "b5323607e876e52e29201a88a218b007e2da7167796be22ca1aee6c09a5216d0",
        "pages": 1,
        "roundTrip": true,
        "text": [
          "Mirrored text",
          "Moved text"
        ],
        "rectangles": [
          {
            "id": "horizontal",
            "x": 10,
            "y": 10,
            "width": 80,
            "height": 20
          },
          {
            "id": "vertical",
            "x": 10,
            "y": 30,
            "width": 80,
            "height": 20
          },
          {
            "id": "both",
            "x": 10,
            "y": 50,
            "width": 80,
            "height": 20
          },
          {
            "id": "shift",
            "x": 15,
            "y": 63,
            "width": 80,
            "height": 20
          },
          {
            "id": "nested",
            "x": 15,
            "y": 83,
            "width": 80,
            "height": 20
          }
        ]
      },
      "version": 1,
      "minorVersion": 0,
      "settings": {
        "margin": 10
      },
      "pages": [
        {
          "content": [
            {
              "type": "Flip",
              "horizontal": true,
              "contentWidth": 80,
              "child": {
                "type": "Container",
                "id": "horizontal",
                "width": 80,
                "height": 20,
                "backgroundColor": "#4499bb"
              }
            },
            {
              "type": "Flip",
              "vertical": true,
              "contentWidth": 80,
              "child": {
                "type": "Container",
                "id": "vertical",
                "width": 80,
                "height": 20,
                "backgroundColor": "#4499bb"
              }
            },
            {
              "type": "Flip",
              "horizontal": true,
              "vertical": true,
              "contentWidth": 80,
              "child": {
                "type": "Container",
                "id": "both",
                "width": 80,
                "height": 20,
                "backgroundColor": "#4499bb"
              }
            },
            {
              "type": "Translate",
              "x": "5pt",
              "y": -7,
              "contentWidth": 80,
              "child": {
                "type": "Container",
                "id": "shift",
                "width": 80,
                "height": 20,
                "backgroundColor": "#4499bb"
              }
            },
            {
              "type": "Translate",
              "x": 5,
              "y": -7,
              "contentWidth": 80,
              "child": {
                "type": "Flip",
                "horizontal": true,
                "contentWidth": 80,
                "child": {
                  "type": "Rotate",
                  "angle": 90,
                  "mode": "constrained",
                  "contentWidth": 20,
                  "child": {
                    "type": "Container",
                    "id": "nested",
                    "width": 20,
                    "height": 80,
                    "backgroundColor": "#4499bb"
                  }
                }
              }
            },
            {
              "type": "Flip",
              "horizontal": true,
              "contentWidth": 100,
              "child": {
                "type": "TextBlock",
                "text": "Mirrored text"
              }
            },
            {
              "type": "Translate",
              "x": {
                "value": -1,
                "unit": "cm"
              },
              "y": "2mm",
              "child": {
                "type": "TextBlock",
                "text": "Moved text"
              }
            }
          ]
        }
      ]
    }
  },
  "invalid": {
    "bad-values": {
      "_fixture": {
        "id": "document-definition/invalid/bad-values",
        "description": "Every value error is returned in one pass, each located. An unknown token, a malformed colour (which the code API would silently turn black), a malformed length, a null, and a wrong JSON type. Nothing is constructed.",
        "spec": "15 §3.2, §3.3, §12.1"
      },
      "_expectErrors": [
        {
          "path": "/settings/conformance",
          "code": "invalid-value"
        },
        {
          "path": "/pages/0/content/0/color",
          "code": "invalid-value"
        },
        {
          "path": "/pages/0/content/0/fontSize",
          "code": "invalid-value"
        },
        {
          "path": "/pages/0/content/0/italic",
          "code": "invalid-type"
        },
        {
          "path": "/pages/0/content/1/height",
          "code": "invalid-value"
        }
      ],
      "version": 1,
      "minorVersion": 0,
      "settings": {
        "conformance": "pdf/a-9z"
      },
      "pages": [
        {
          "content": [
            {
              "type": "TextBlock",
              "text": "x",
              "color": "ff00aa",
              "fontSize": "12furlongs",
              "italic": "yes"
            },
            {
              "type": "Spacer",
              "height": null
            }
          ]
        }
      ]
    },
    "chart-conflict": {
      "_fixture": {
        "id": "document-definition/invalid/chart-conflict",
        "description": "A chart's own title, xAxis and yAxis and the copies inside `data` may both be given, but must agree: the reader would otherwise have to choose, and a stored file would say something the PDF does not show. Equal values (compared as JSON, key order ignored) are fine.",
        "spec": "15 §8.9"
      },
      "_expectErrors": [
        {
          "path": "/pages/0/content/0",
          "code": "conflicting-keys"
        },
        {
          "path": "/pages/0/content/0",
          "code": "conflicting-keys"
        }
      ],
      "version": 1,
      "minorVersion": 0,
      "pages": [
        {
          "content": [
            {
              "type": "LineChart",
              "altText": "conflict",
              "title": "Revenue",
              "yAxis": {
                "prefix": "$",
                "maxValue": 100
              },
              "data": {
                "title": "Sales",
                "yAxis": {
                  "maxValue": 100,
                  "prefix": "£"
                },
                "xAxis": {
                  "legend": "Quarter"
                },
                "series": [
                  {
                    "dataPoints": [
                      {
                        "label": "a",
                        "value": 1
                      }
                    ]
                  }
                ]
              },
              "xAxis": {
                "legend": "Quarter"
              }
            }
          ]
        }
      ]
    },
    "font-features": {
      "_fixture": {
        "id": "document-definition/invalid/font-features",
        "description": "Reject invalid feature tags and values before constructing a document.",
        "spec": "19"
      },
      "_expectErrors": [
        {
          "path": "/pages/0/content/0/fontFeatures",
          "code": "invalid-value"
        },
        {
          "path": "/pages/0/content/1/fontFeatures",
          "code": "invalid-value"
        }
      ],
      "version": 1,
      "minorVersion": 0,
      "pages": [
        {
          "content": [
            {
              "type": "TextBlock",
              "text": "office",
              "fontFeatures": {
                "bad": 1
              }
            },
            {
              "type": "TextBlock",
              "text": "AV",
              "fontFeatures": {
                "kern": 65536
              }
            }
          ]
        }
      ]
    },
    "list-items": {
      "_fixture": {
        "id": "document-definition/invalid/list-items",
        "description": "A list item must be a string or a nested list of the same type. An element is invalid-type, and a nested list of the other kind is invalid-value.",
        "spec": "15 §8.5"
      },
      "_expectErrors": [
        {
          "path": "/pages/0/content/0/items/1",
          "code": "invalid-type"
        },
        {
          "path": "/pages/0/content/0/items/2/type",
          "code": "invalid-value"
        }
      ],
      "version": 1,
      "minorVersion": 0,
      "pages": [
        {
          "content": [
            {
              "type": "UnorderedList",
              "items": [
                "fine",
                {
                  "type": "TextBlock",
                  "text": "not a string"
                },
                {
                  "type": "OrderedList",
                  "items": [
                    "wrong kind"
                  ]
                }
              ]
            }
          ]
        }
      ]
    },
    "missing-version": {
      "_fixture": {
        "id": "document-definition/invalid/missing-version",
        "description": "No version stamps. A writer that omitted them did not decide, so the reader does not assume 1.0 (15 §12.2).",
        "spec": "15 §12.2"
      },
      "_expectErrors": [
        {
          "path": "",
          "code": "missing-version"
        }
      ],
      "pages": [
        {
          "content": []
        }
      ]
    },
    "newer-minor": {
      "_fixture": {
        "id": "document-definition/invalid/newer-minor",
        "description": "A reader supporting 1.0 meets a 1.3 document using a property and an element type it does not know. It refuses by default, one newer-minor error per unrecognised item at its path (a reader cannot know which minor version introduced what it does not recognise, so no `since`); with bestEffort it would read the rest, ignore the unrecognised key and leave out the unrecognised element, and return three warnings: the two items and the version itself. The key `hyphenate` and type `Callout` are invented for this fixture and are not, and will not become, real names.",
        "spec": "15 §12.2; 14 §7.2",
        "readerSupports": "1.0"
      },
      "_expectErrors": [
        {
          "path": "/pages/0/content/0/hyphenate",
          "code": "newer-minor"
        },
        {
          "path": "/pages/0/content/1",
          "code": "newer-minor"
        }
      ],
      "_expectBestEffort": {
        "warnings": 3,
        "pages": 1,
        "text": [
          "Kept"
        ]
      },
      "version": 1,
      "minorVersion": 3,
      "pages": [
        {
          "content": [
            {
              "type": "TextBlock",
              "text": "Kept",
              "hyphenate": true
            },
            {
              "type": "Callout",
              "text": "Dropped in best-effort mode"
            }
          ]
        }
      ]
    },
    "pie-multiple-series": {
      "_fixture": {
        "id": "document-definition/invalid/pie-multiple-series",
        "description": "A pie chart uses series[0] only. The code API silently ignores the rest; a validator must not, or a stored file says something the PDF does not show.",
        "spec": "15 §8.9"
      },
      "_expectErrors": [
        {
          "path": "/pages/0/content/0/data/series",
          "code": "invalid-value"
        }
      ],
      "version": 1,
      "minorVersion": 0,
      "pages": [
        {
          "content": [
            {
              "type": "PieChart",
              "altText": "Two series",
              "data": {
                "series": [
                  {
                    "name": "A",
                    "dataPoints": [
                      {
                        "label": "x",
                        "value": 1
                      }
                    ]
                  },
                  {
                    "name": "B",
                    "dataPoints": [
                      {
                        "label": "x",
                        "value": 2
                      }
                    ]
                  }
                ]
              }
            }
          ]
        }
      ]
    },
    "rotation": {
      "_fixture": {
        "id": "document-definition/invalid/rotation",
        "description": "Constrained angles must be quarter turns; content width must be positive.",
        "spec": "17"
      },
      "_expectErrors": [
        {
          "path": "/pages/0/content/0/angle",
          "code": "invalid-value"
        },
        {
          "path": "/pages/0/content/1/contentWidth",
          "code": "invalid-value"
        },
        {
          "path": "/pages/0/content/2/contentWidth",
          "code": "invalid-value"
        },
        {
          "path": "/pages/0/content/3/contentWidth",
          "code": "invalid-value"
        }
      ],
      "version": 1,
      "minorVersion": 0,
      "pages": [
        {
          "content": [
            {
              "type": "Rotate",
              "mode": "constrained",
              "angle": 45
            },
            {
              "type": "Rotate",
              "contentWidth": 0
            },
            {
              "type": "Rotate",
              "contentWidth": "-1mm"
            },
            {
              "type": "Rotate",
              "contentWidth": {
                "value": 0,
                "unit": "cm"
              }
            }
          ]
        }
      ]
    },
    "secret-in-definition": {
      "_fixture": {
        "id": "document-definition/invalid/secret-in-definition",
        "description": "A password in a definition is refused, not used: a file people commit, paste and email must never be where a password lives. The error is the same whether the key is spelled with a value or empty.",
        "spec": "15 §11.3"
      },
      "_expectErrors": [
        {
          "path": "/settings/encryption/ownerPassword",
          "code": "secret-in-definition"
        },
        {
          "path": "/settings/encryption/userPassword",
          "code": "secret-in-definition"
        }
      ],
      "version": 1,
      "minorVersion": 0,
      "settings": {
        "pdfVersion": "pdf-1.7",
        "encryption": {
          "algorithm": "aes-256",
          "ownerPassword": "hunter2",
          "userPassword": ""
        }
      },
      "pages": [
        {
          "content": []
        }
      ]
    },
    "structure": {
      "_fixture": {
        "id": "document-definition/invalid/structure",
        "description": "Structural errors: a required key missing (TextBlock.text), a required choice over-specified (Hyperlink uri and targetPageIndex), keys that cannot coexist (fontName and fontFamily), a duplicate id, and references to nothing (a resource, an anchor, a page beyond the last, a heading identifier no Heading carries).",
        "spec": "15 §4.1, §8.4, §8.8, §12.4"
      },
      "_expectErrors": [
        {
          "path": "/pages/0/content/0",
          "code": "missing-required"
        },
        {
          "path": "/pages/0/content/1",
          "code": "exactly-one-of"
        },
        {
          "path": "/pages/0/content/2",
          "code": "conflicting-keys"
        },
        {
          "path": "/pages/0/content/4/id",
          "code": "duplicate-id"
        },
        {
          "path": "/pages/0/content/5/resource",
          "code": "dangling-reference"
        },
        {
          "path": "/pages/0/content/6/anchorTarget",
          "code": "dangling-reference"
        },
        {
          "path": "/pages/0/content/7/targetPageIndex",
          "code": "dangling-reference"
        },
        {
          "path": "/pages/0/content/8/headingIdentifiers/0",
          "code": "dangling-reference"
        }
      ],
      "version": 1,
      "minorVersion": 0,
      "pages": [
        {
          "content": [
            {
              "type": "TextBlock"
            },
            {
              "type": "Hyperlink",
              "text": "both",
              "uri": "https://example.com",
              "targetPageIndex": 0
            },
            {
              "type": "TextBlock",
              "text": "x",
              "fontName": "Helvetica",
              "fontFamily": "Arial"
            },
            {
              "type": "Spacer",
              "id": "a"
            },
            {
              "type": "Spacer",
              "id": "a"
            },
            {
              "type": "Image",
              "resource": "missing-logo"
            },
            {
              "type": "SectionLink",
              "text": "see",
              "anchorTarget": "nowhere"
            },
            {
              "type": "Hyperlink",
              "text": "far",
              "targetPageIndex": 9
            },
            {
              "type": "VisualToc",
              "headingIdentifiers": [
                "absent"
              ]
            }
          ]
        }
      ]
    },
    "transforms": {
      "_fixture": {
        "id": "document-definition/invalid/transforms",
        "description": "Reject invalid axes, offsets and nonpositive content widths.",
        "spec": "18"
      },
      "_expectErrors": [
        {
          "path": "/pages/0/content/0/horizontal",
          "code": "invalid-type"
        },
        {
          "path": "/pages/0/content/1/contentWidth",
          "code": "invalid-value"
        },
        {
          "path": "/pages/0/content/2/x",
          "code": "invalid-value"
        },
        {
          "path": "/pages/0/content/3/contentWidth",
          "code": "invalid-value"
        }
      ],
      "version": 1,
      "minorVersion": 0,
      "pages": [
        {
          "content": [
            {
              "type": "Flip",
              "horizontal": "yes"
            },
            {
              "type": "Flip",
              "contentWidth": "-1mm"
            },
            {
              "type": "Translate",
              "x": "nonsense"
            },
            {
              "type": "Translate",
              "contentWidth": 0
            }
          ]
        }
      ]
    },
    "unknown-type": {
      "_fixture": {
        "id": "document-definition/invalid/unknown-type",
        "description": "The vocabulary is closed: a type outside the catalogue fails before anything renders, and the error is located by path.",
        "spec": "15 §4, §12.4"
      },
      "_expectErrors": [
        {
          "path": "/pages/0/content/0",
          "code": "unknown-type"
        }
      ],
      "version": 1,
      "minorVersion": 0,
      "pages": [
        {
          "content": [
            {
              "type": "SparklyHeading",
              "text": "Nope"
            }
          ]
        }
      ]
    },
    "unsupported-version": {
      "_fixture": {
        "id": "document-definition/invalid/unsupported-version",
        "description": "A newer major version is refused, naming the version found and the range supported; never a parse error or a partial result.",
        "spec": "15 §12.2; 14 §7.1 rule 6"
      },
      "_expectErrors": [
        {
          "path": "/version",
          "code": "unsupported-version"
        }
      ],
      "version": 2,
      "minorVersion": 0,
      "pages": [
        {
          "content": []
        }
      ]
    }
  },
  "unrepresentable": {
    "function-template": {
      "_fixture": {
        "id": "document-definition/unrepresentable/function-template",
        "description": "A DOCUMENT (not a definition) whose footerTemplate is a function and which holds a CanvasElement. toDefinition is strict by default: it fails, listing both nodes with locations, and writes nothing. With onUnrepresentable 'drop' it returns a definition of the rest plus one `dropped` note each; that result is not a faithful copy and the round-trip guarantee does not apply. Each core builds the document from `recipe` in its own idiom.",
        "spec": "15 §11"
      },
      "recipe": {
        "settings": {
          "footerTemplate": "function of the page number returning TextBlock('Page N')"
        },
        "pages": [
          {
            "content": [
              {
                "type": "TextBlock",
                "text": "Kept"
              },
              {
                "type": "CanvasElement",
                "drawHeight": 80,
                "draw": "any drawing callback"
              }
            ]
          }
        ]
      },
      "_expectNotes": {
        "strict": {
          "fails": true,
          "issues": [
            {
              "path": "/settings/footerTemplate",
              "code": "unrepresentable"
            },
            {
              "path": "/pages/0/content/1",
              "code": "unrepresentable"
            }
          ]
        },
        "drop": {
          "fails": false,
          "notes": [
            {
              "path": "/settings/footerTemplate",
              "code": "dropped"
            },
            {
              "path": "/pages/0/content/1",
              "code": "dropped"
            }
          ],
          "definition": {
            "version": 1,
            "minorVersion": 0,
            "pages": [
              {
                "content": [
                  {
                    "type": "TextBlock",
                    "text": "Kept"
                  }
                ]
              }
            ]
          }
        }
      }
    }
  },
  "settings-rules": {
    "aes256-on-default-version": {
      "_fixture": {
        "id": "document-definition/settings-rules/aes256-on-default-version",
        "description": "AES-256 needs PDF 1.7 or later; the default is 1.4.",
        "spec": "15 §5.2"
      },
      "_expect": {
        "valid": false,
        "rule": "aes256-needs-pdf17"
      },
      "version": 1,
      "minorVersion": 0,
      "settings": {
        "encryption": {
          "algorithm": "aes-256"
        }
      },
      "pages": [
        {
          "content": [
            {
              "type": "TextBlock",
              "text": "Hello"
            }
          ]
        }
      ]
    },
    "aes256-on-pdf17": {
      "_fixture": {
        "id": "document-definition/settings-rules/aes256-on-pdf17",
        "description": "AES-256 on PDF 1.7.",
        "spec": "15 §5.2"
      },
      "_expect": {
        "valid": true,
        "pdfVersion": "pdf-1.7"
      },
      "version": 1,
      "minorVersion": 0,
      "settings": {
        "pdfVersion": "pdf-1.7",
        "encryption": {
          "algorithm": "aes-256"
        }
      },
      "pages": [
        {
          "content": [
            {
              "type": "TextBlock",
              "text": "Hello"
            }
          ]
        }
      ]
    },
    "aes256-on-pdf20": {
      "_fixture": {
        "id": "document-definition/settings-rules/aes256-on-pdf20",
        "description": "AES-256 is allowed on PDF 2.0 as well as 1.7.",
        "spec": "15 §5.2"
      },
      "_expect": {
        "valid": true,
        "pdfVersion": "pdf-2.0"
      },
      "version": 1,
      "minorVersion": 0,
      "settings": {
        "pdfVersion": "pdf-2.0",
        "encryption": {
          "algorithm": "aes-256"
        }
      },
      "pages": [
        {
          "content": [
            {
              "type": "TextBlock",
              "text": "Hello"
            }
          ]
        }
      ]
    },
    "bookmarks-on-default-version": {
      "_fixture": {
        "id": "document-definition/settings-rules/bookmarks-on-default-version",
        "description": "Bookmarks need PDF 1.7 or later.",
        "spec": "15 §5.2"
      },
      "_expect": {
        "valid": false,
        "rule": "bookmarks-need-pdf17"
      },
      "version": 1,
      "minorVersion": 0,
      "settings": {
        "bookmarks": [
          {
            "title": "Start",
            "pageIndex": 0
          }
        ]
      },
      "pages": [
        {
          "content": [
            {
              "type": "TextBlock",
              "text": "Hello"
            }
          ]
        }
      ]
    },
    "bookmarks-on-pdf17": {
      "_fixture": {
        "id": "document-definition/settings-rules/bookmarks-on-pdf17",
        "description": "Bookmarks on PDF 1.7.",
        "spec": "15 §5.2"
      },
      "_expect": {
        "valid": true,
        "pdfVersion": "pdf-1.7"
      },
      "version": 1,
      "minorVersion": 0,
      "settings": {
        "pdfVersion": "pdf-1.7",
        "bookmarks": [
          {
            "title": "Start",
            "pageIndex": 0
          }
        ]
      },
      "pages": [
        {
          "content": [
            {
              "type": "TextBlock",
              "text": "Hello"
            }
          ]
        }
      ]
    },
    "bookmarks-on-pdf20": {
      "_fixture": {
        "id": "document-definition/settings-rules/bookmarks-on-pdf20",
        "description": "Bookmarks are allowed on PDF 2.0.",
        "spec": "15 §5.2"
      },
      "_expect": {
        "valid": true,
        "pdfVersion": "pdf-2.0"
      },
      "version": 1,
      "minorVersion": 0,
      "settings": {
        "pdfVersion": "pdf-2.0",
        "bookmarks": [
          {
            "title": "Start",
            "pageIndex": 0
          }
        ]
      },
      "pages": [
        {
          "content": [
            {
              "type": "TextBlock",
              "text": "Hello"
            }
          ]
        }
      ]
    },
    "pdfa-a-level-with-tagging": {
      "_fixture": {
        "id": "document-definition/settings-rules/pdfa-a-level-with-tagging",
        "description": "An \"a\" level with PDF/UA-1 is valid and lands on PDF 1.7.",
        "spec": "15 §5.2"
      },
      "_expect": {
        "valid": true,
        "pdfVersion": "pdf-1.7"
      },
      "version": 1,
      "minorVersion": 0,
      "settings": {
        "conformance": "pdf/a-2a",
        "accessibility": "pdf/ua-1"
      },
      "pages": [
        {
          "content": [
            {
              "type": "TextBlock",
              "text": "Hello"
            }
          ]
        }
      ]
    },
    "pdfa-a-level-without-tagging": {
      "_fixture": {
        "id": "document-definition/settings-rules/pdfa-a-level-without-tagging",
        "description": "An \"a\" level of PDF/A needs tagged output.",
        "spec": "15 §5.2"
      },
      "_expect": {
        "valid": false,
        "rule": "pdfa-a-levels-need-tagging"
      },
      "version": 1,
      "minorVersion": 0,
      "settings": {
        "conformance": "pdf/a-2a"
      },
      "pages": [
        {
          "content": [
            {
              "type": "TextBlock",
              "text": "Hello"
            }
          ]
        }
      ]
    },
    "pdfa-with-encryption": {
      "_fixture": {
        "id": "document-definition/settings-rules/pdfa-with-encryption",
        "description": "PDF/A cannot be combined with encryption.",
        "spec": "15 §5.2"
      },
      "_expect": {
        "valid": false,
        "rule": "pdfa-excludes-encryption"
      },
      "version": 1,
      "minorVersion": 0,
      "settings": {
        "conformance": "pdf/a-2b",
        "encryption": {
          "algorithm": "rc4-128"
        }
      },
      "pages": [
        {
          "content": [
            {
              "type": "TextBlock",
              "text": "Hello"
            }
          ]
        }
      ]
    },
    "pdfa2b-sets-pdf17": {
      "_fixture": {
        "id": "document-definition/settings-rules/pdfa2b-sets-pdf17",
        "description": "PDF/A-2b sets the PDF version to 1.7, even from 2.0.",
        "spec": "15 §5.2"
      },
      "_expect": {
        "valid": true,
        "pdfVersion": "pdf-1.7"
      },
      "version": 1,
      "minorVersion": 0,
      "settings": {
        "conformance": "pdf/a-2b",
        "pdfVersion": "pdf-2.0"
      },
      "pages": [
        {
          "content": [
            {
              "type": "TextBlock",
              "text": "Hello"
            }
          ]
        }
      ]
    },
    "pdfa2b-with-ua1-on-pdf20": {
      "_fixture": {
        "id": "document-definition/settings-rules/pdfa2b-with-ua1-on-pdf20",
        "description": "PDF/A-2b lowers the version to 1.7 before PDF/UA-1 is checked, so the pair is valid.",
        "spec": "15 §5.2"
      },
      "_expect": {
        "valid": true,
        "pdfVersion": "pdf-1.7"
      },
      "version": 1,
      "minorVersion": 0,
      "settings": {
        "conformance": "pdf/a-2b",
        "accessibility": "pdf/ua-1",
        "pdfVersion": "pdf-2.0"
      },
      "pages": [
        {
          "content": [
            {
              "type": "TextBlock",
              "text": "Hello"
            }
          ]
        }
      ]
    },
    "pdfa4-raises-version": {
      "_fixture": {
        "id": "document-definition/settings-rules/pdfa4-raises-version",
        "description": "PDF/A-4 raises the PDF version to 2.0.",
        "spec": "15 §5.2"
      },
      "_expect": {
        "valid": true,
        "pdfVersion": "pdf-2.0"
      },
      "version": 1,
      "minorVersion": 0,
      "settings": {
        "conformance": "pdf/a-4"
      },
      "pages": [
        {
          "content": [
            {
              "type": "TextBlock",
              "text": "Hello"
            }
          ]
        }
      ]
    },
    "pdfa4-with-ua1": {
      "_fixture": {
        "id": "document-definition/settings-rules/pdfa4-with-ua1",
        "description": "PDF/A-4 is PDF 2.0, so it cannot be combined with PDF/UA-1.",
        "spec": "15 §5.2"
      },
      "_expect": {
        "valid": false,
        "rule": "ua1-needs-pdf17"
      },
      "version": 1,
      "minorVersion": 0,
      "settings": {
        "conformance": "pdf/a-4",
        "accessibility": "pdf/ua-1"
      },
      "pages": [
        {
          "content": [
            {
              "type": "TextBlock",
              "text": "Hello"
            }
          ]
        }
      ]
    },
    "ua1-on-pdf20": {
      "_fixture": {
        "id": "document-definition/settings-rules/ua1-on-pdf20",
        "description": "PDF/UA-1 cannot be combined with an explicit PDF 2.0.",
        "spec": "15 §5.2"
      },
      "_expect": {
        "valid": false,
        "rule": "ua1-needs-pdf17"
      },
      "version": 1,
      "minorVersion": 0,
      "settings": {
        "accessibility": "pdf/ua-1",
        "pdfVersion": "pdf-2.0"
      },
      "pages": [
        {
          "content": [
            {
              "type": "TextBlock",
              "text": "Hello"
            }
          ]
        }
      ]
    },
    "ua1-raises-version": {
      "_fixture": {
        "id": "document-definition/settings-rules/ua1-raises-version",
        "description": "PDF/UA-1 raises the default PDF version to 1.7.",
        "spec": "15 §5.2"
      },
      "_expect": {
        "valid": true,
        "pdfVersion": "pdf-1.7"
      },
      "version": 1,
      "minorVersion": 0,
      "settings": {
        "accessibility": "pdf/ua-1"
      },
      "pages": [
        {
          "content": [
            {
              "type": "TextBlock",
              "text": "Hello"
            }
          ]
        }
      ]
    }
  }
};
