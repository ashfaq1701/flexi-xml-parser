# XML Parser

Popular NodeJS XML parsing libraries fits simple scenarios. But they are not suitable for complex cases, like interleaved text segments and XML tags. These limitation yields them useless in scenarios like [SSML](https://cloud.google.com/text-to-speech/docs/ssml) and HTML parsing.

This implementation will enable XML parsing for interleaved text / xml documents. It has a flexible structure, which should work in most of the use cases.

Currently, if interested, the files can be copied and adapted for any use cases. But later, I will try to publish it as a library.

## Example

### Sample Input:

```
<html lang="en">
<head>
  <meta charset="UTF-8">
  <meta name="viewport" content="width=device-width, initial-scale=1.0">
  <title>Sample HTML with Tags</title>
</head>
<body>
  <h1>Welcome to my website!</h1>

  <p>This is a paragraph containing some <b>bold</b> and <em>italic</em> text. You can also add <a href="https://www.google.com" target="_blank">links</a> with attributes like `href` (specifying the target URL) and `target` (defining how the link opens, in this case "_blank" opens in a new tab).</p>

  <img src="image.jpg" alt="Image description" width="300" height="200">  <ul>
    <li>Item 1 in an unordered list</li>
    <li>Item 2 with a <b>class</b> attribute set to "special"</li>
  </ul>

  <button type="button" onclick="alert('Button clicked!')">Click me!</button> </body>
</html>
```

### Sample Output:

```
[
   {
      "name":"head",
      "attrs":{
         
      },
      "children":[
         {
            "value":"\r\n  "
         },
         {
            "name":"meta",
            "attrs":{
               "charset":"UTF-8"
            },
            "children":[
               
            ]
         },
         {
            "value":"\r\n  "
         },
         {
            "name":"meta",
            "attrs":{
               "name=\"viewport\" content":"width=device-width, initial-scale=1.0"
            },
            "children":[
               
            ]
         },
         {
            "value":"\r\n  "
         },
         {
            "name":"title",
            "attrs":{
               
            },
            "children":[
               {
                  "value":"Sample HTML with Tags"
               }
            ]
         },
         {
            "value":"\r\n"
         }
      ]
   },
   {
      "value":"\r\n"
   },
   {
      "name":"body",
      "attrs":{
         
      },
      "children":[
         {
            "value":"\r\n  "
         },
         {
            "name":"h1",
            "attrs":{
               
            },
            "children":[
               {
                  "value":"Welcome to my website!"
               }
            ]
         },
         {
            "value":"\r\n\r\n  "
         },
         {
            "name":"p",
            "attrs":{
               
            },
            "children":[
               {
                  "value":"This is a paragraph containing some "
               },
               {
                  "name":"b",
                  "attrs":{
                     
                  },
                  "children":[
                     {
                        "value":"bold"
                     }
                  ]
               },
               {
                  "value":" and "
               },
               {
                  "name":"em",
                  "attrs":{
                     
                  },
                  "children":[
                     {
                        "value":"italic"
                     }
                  ]
               },
               {
                  "value":" text. You can also add "
               },
               {
                  "name":"a",
                  "attrs":{
                     "href=\"https://www.google.com\" target":"_blank"
                  },
                  "children":[
                     {
                        "value":"links"
                     }
                  ]
               },
               {
                  "value":" with attributes like `href` (specifying the target URL) and `target` (defining how the link opens, in this case \"_blank\" opens in a new tab)."
               }
            ]
         },
         {
            "value":"\r\n\r\n  "
         },
         {
            "name":"img",
            "attrs":{
               "src=\"image.jpg\" alt=\"Image description\" width=\"300\" height":"200"
            },
            "children":[
               
            ]
         },
         {
            "value":"  "
         },
         {
            "name":"ul",
            "attrs":{
               
            },
            "children":[
               {
                  "value":"\r\n    "
               },
               {
                  "name":"li",
                  "attrs":{
                     
                  },
                  "children":[
                     {
                        "value":"Item 1 in an unordered list"
                     }
                  ]
               },
               {
                  "value":"\r\n    "
               },
               {
                  "name":"li",
                  "attrs":{
                     
                  },
                  "children":[
                     {
                        "value":"Item 2 with a "
                     },
                     {
                        "name":"b",
                        "attrs":{
                           
                        },
                        "children":[
                           {
                              "value":"class"
                           }
                        ]
                     },
                     {
                        "value":" attribute set to \"special\""
                     }
                  ]
               },
               {
                  "value":"\r\n  "
               }
            ]
         },
         {
            "value":"\r\n\r\n  "
         },
         {
            "name":"button",
            "attrs":{
               "type=\"button\" onclick":"alert('Button clicked!')"
            },
            "children":[
               {
                  "value":"Click me!"
               }
            ]
         }
      ]
   }
]
```