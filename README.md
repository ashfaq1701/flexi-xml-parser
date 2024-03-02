# XML Parser

Popular NodeJS XML parsing libraries fits simple scenarios. But they are not suitable for complex cases, like interleaved text and XML. These limitation yields them useless in scenarios like [SSML](https://cloud.google.com/text-to-speech/docs/ssml) and HTML parsing.

This implementation will enable XML parsing for interleaved text / xml documents. It has a flexible structure, which should work in most of the use cases.

Currently, if interested, the files can be copied and adapted for any use cases. But later, I will try to publish it as a library.

## Example

### Sample Request:

```
<speak>
  Here are <say-as interpret-as="characters">SSML</say-as> samples.
  I can pause <break time="3s"/>.
  I can play a sound
  <audio src="https://www.example.com/MY_MP3_FILE.mp3">didn't get your MP3 audio file</audio>.
  I can speak in cardinals. Your number is <say-as interpret-as="cardinal">10</say-as>.
  Or I can speak in ordinals. You are <say-as interpret-as="ordinal">10</say-as> in line.
  Or I can even speak in digits. The digits for ten are <say-as interpret-as="characters">10</say-as>.
  I can also substitute phrases, like the <sub alias="World Wide Web Consortium">W3C</sub>.
  Finally, I can speak a paragraph with two sentences.
  <p><s>This is sentence one.</s><s>This is sentence two.</s></p>
</speak>
```

### Sample Response:

```
[
   {
      "name":"speak",
      "attrs":{
         
      },
      "children":[
         {
            "value":"\r\n  Here are "
         },
         {
            "name":"say-as",
            "attrs":{
               "interpret-as":"characters"
            },
            "children":[
               {
                  "value":"SSML"
               }
            ]
         },
         {
            "value":" samples.\r\n  I can pause "
         },
         {
            "name":"break",
            "attrs":{
               "time":"3s"
            },
            "children":[
               
            ]
         },
         {
            "value":".\r\n  I can play a sound\r\n  "
         },
         {
            "name":"audio",
            "attrs":{
               "src":"https://www.example.com/MY_MP3_FILE.mp3"
            },
            "children":[
               {
                  "value":"didn't get your MP3 audio file"
               }
            ]
         },
         {
            "value":".\r\n  I can speak in cardinals. Your number is "
         },
         {
            "name":"say-as",
            "attrs":{
               "interpret-as":"cardinal"
            },
            "children":[
               {
                  "value":"10"
               }
            ]
         },
         {
            "value":".\r\n  Or I can speak in ordinals. You are "
         },
         {
            "name":"say-as",
            "attrs":{
               "interpret-as":"ordinal"
            },
            "children":[
               {
                  "value":"10"
               }
            ]
         },
         {
            "value":" in line.\r\n  Or I can even speak in digits. The digits for ten are "
         },
         {
            "name":"say-as",
            "attrs":{
               "interpret-as":"characters"
            },
            "children":[
               {
                  "value":"10"
               }
            ]
         },
         {
            "value":".\r\n  I can also substitute phrases, like the "
         },
         {
            "name":"sub",
            "attrs":{
               "alias":"World Wide Web Consortium"
            },
            "children":[
               {
                  "value":"W3C"
               }
            ]
         },
         {
            "value":".\r\n  Finally, I can speak a paragraph with two sentences.\r\n  "
         },
         {
            "name":"p",
            "attrs":{
               
            },
            "children":[
               {
                  "name":"s",
                  "attrs":{
                     
                  },
                  "children":[
                     {
                        "value":"This is sentence one."
                     }
                  ]
               },
               {
                  "name":"s",
                  "attrs":{
                     
                  },
                  "children":[
                     {
                        "value":"This is sentence two."
                     }
                  ]
               }
            ]
         }
      ]
   }
]
```