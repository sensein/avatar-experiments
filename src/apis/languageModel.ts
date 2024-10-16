/**
 * Copyright 2023 Google LLC
 *
 * Licensed under the Apache License, Version 2.0 (the "License");
 * you may not use this file except in compliance with the License.
 * You may obtain a copy of the License at
 *
 *     http://www.apache.org/licenses/LICENSE-2.0
 *
 * Unless required by applicable law or agreed to in writing, software
 * distributed under the License is distributed on an "AS IS" BASIS,
 * WITHOUT WARRANTIES OR CONDITIONS OF ANY KIND, either express or implied.
 * See the License for the specific language governing permissions and
 * limitations under the License.
 */

import {useContext, useEffect} from 'react';

import {ConfigContext} from '../context/config';
import {LANGUAGE_MODEL_URL, LANGUAGE_MODEL_BASE_URL, HUGGING_INFERENCE_KEY} from '../context/constants';

import {HfInference} from '@huggingface/inference';
const { GoogleGenerativeAI } = require("@google/generative-ai");

let past_user_inputs: string[] = [];
let generated_responses: string[] = [];

/**
 * Represents a message object with an author and content.
 * @interface
 * @property {string} author - The author of the message.
 * @property {string} content - The content of the message.
 */
export interface MessageProps {
  author: string;
  content: string;
}

/**
 * Represents an example object that defines the expected input and output for a
 * prompt.
 * @interface
 * @property {string} input.content - The content of the input for the example.
 * @property {string} output.content - The expected output content for the
 * example.
 */
export interface ExampleProps {
  input: {content: string};
  output: {content: string};
}

/**
 * Represents the properties for a prompt object, which contains a context,
 * examples, and a list of messages.
 * @interface
 * @property {string} [context] - The context for the prompt.
 * @property {ExampleProps[]} [examples] - An array of example objects that
 * define the expected input and output of the prompt.
 * @property {MessageProps[]} messages - An array of message objects that
 * represent the prompt's messages.
 */
export interface PromptProps {
  context?: string;
  examples?: ExampleProps[];
  messages: MessageProps[];
}

/**
 * Represents the response object returned by the sendPrompt function.
 * @interface
 * @property {MessageProps[]} messages - An array of message objects that
 * represent the prompt's messages.
 * @property {MessageProps[]} candidates - An array of message objects that
 * represent the potential responses to the prompt.
 */
export interface SendPromptResponse {
  candidates: MessageProps[];
  messages: MessageProps[];
}

type LanguageModel = {
  sendMessage: (message: string) => Promise<string>;
};

const useLanguageModel = ():
    LanguageModel => {
      const languageModelUrl = `${
        LANGUAGE_MODEL_BASE_URL}/v1beta2/models/chat-bison-001:generateMessage?key=${
        sessionStorage.getItem('palmApiKey')}`;
      const config = useContext(ConfigContext);

      let context = '';
      let messages: MessageProps[] = [];

      const sendPrompt = async (prompt: PromptProps, temperature: number) => {
        const geminiUrl = `https://generativelanguage.googleapis.com/v1beta/models/gemini-1.0-pro:generateContent?key=${sessionStorage.getItem('palmApiKey')}`;

        const payload = {
          contents: [
            {"role": "user", "parts": [{"text": prompt.context}]},
            {"role": "model", "parts": [{"text": "ok. i will try my best to follow your instruction. Let's start the conversation."}]},
            ...prompt.messages.map(msg => (
              {"role": msg.author === '0' ? "user" : "model", "parts": [{"text": msg.content}]}
            ))
          ],
          generationConfig: {
            Temperature: 0.9,
            topK: 1,
            topP: 1,
            maxOutputTokens: 192,
            stopSequences: []
          },
          safetySettings: [
            {
              "category": "HARM_CATEGORY_HARASSMENT",
              "threshold": "BLOCK_MEDIUM_AND_ABOVE"
            },
            {
              "category": "HARM_CATEGORY_HATE_SPEECH",
              "threshold": "BLOCK_MEDIUM_AND_ABOVE"
            },
            {
              "category": "HARM_CATEGORY_SEXUALLY_EXPLICIT",
              "threshold": "BLOCK_MEDIUM_AND_ABOVE"
            },
            {
              "category": "HARM_CATEGORY_DANGEROUS_CONTENT",
              "threshold": "BLOCK_MEDIUM_AND_ABOVE"
            }
          ]
        };

        console.log("payload", JSON.stringify(payload));
        const response = await fetch(geminiUrl, {
          headers: {
            'Content-Type': 'application/json',
          },
          body: JSON.stringify(payload),
          method: 'POST',
        });
        console.log("response", response);

        const data = await response.json();
        console.log("data", data);
        if (!data.candidates || !data.candidates.length) {
          console.error("No candidates received.");
          return null;
        }

        const textResponse = data.candidates[0].content.parts.map((part: { text: any; }) => part.text).join(' ');
        console.log("textResponse", textResponse);
        return {content: textResponse};


        
        /*
        const geminiUrl = `https://generativelanguage.googleapis.com/v1beta/models/gemini-1.0-pro:generateContent?key=${sessionStorage.getItem('palmApiKey')}`;
        
        const payload = {
          contents: [
            {"role": "user", "parts": [{"text": prompt.context}]},
            ...prompt.messages.map(msg => (
              {"role": msg.author === '0' ? "user" : "model", "parts": [{"text": msg.content}]}
            ))
          ]
        };
        console.log("payload", payload);
        const response = await fetch(geminiUrl, {
          headers: {
            'Content-Type': 'application/json',
          },
          body: JSON.stringify(payload),
          method: 'POST',
        });
        console.log("response", response);

        if (!response.ok) {
          throw new Error(`HTTP error! status: ${response.status}`);
        }

        const data = await response.json();
        if (!data.candidates || !data.candidates.length) {
            console.error("No candidates received.");
            return null;
        }

        console.log("data", data);
        const textResponse = data.candidates[0].content.parts.map((part: { text: any; }) => part.text).join(' ');
        console.log("textResponse", textResponse);
        return {content: textResponse};
        */
      };
      
      /*
      const sendPrompt = async(prompt: PromptProps, temperature: number):
          Promise<SendPromptResponse> => {
            const payload = {
              prompt: {...prompt},
              temperature,
              candidate_count: 1,
            };
            
            const response = await fetch(languageModelUrl, {
              headers: {
                'Content-Type': 'application/json',
              },
              body: JSON.stringify(payload),
              method: 'POST',
            });
            
            return response.json() as Promise<SendPromptResponse>;
          };
      */

      useEffect(() => {
        context = `Your task is to acting as a character that has this personality: ${
            config.state
                .personality}. 
                Your response must be based on your personality. The stories to base your activities on are: ${
            config.state.backStory}. 
            The activity is: ${
            config.state
                .knowledgeBase}. The response should be one single sentence only.`;
      }, [config]);

      const sendMessage = async(message: string): Promise<string> => {
        const content = `{${message}}`;

        messages = messages.concat([{author: '0', content}]);
        const prompt: PromptProps = {
          context: context,
          messages: messages,
        };

        // uses PaLM API
        if (sessionStorage.getItem("usePalmApi") == "true") {
          console.log('using PaLM API');
          const response = await sendPrompt(prompt, 0.25);
          
          if (response && response.content) {
            messages = messages.concat([{author: '1', content: response.content}]);
            return response.content;
          }
          return 'I couldn\'t understand your previous message. Could you try phrasing it in another way?';
        
        // uses Huggingface conversational API
        } else {
          console.log('using Huggingface conversational API');
          past_user_inputs.push(content);
          const hf = new HfInference(sessionStorage.getItem("huggingFaceApiKey")!);
          const possible_response = await hf.conversational({
            model: 'microsoft/DialoGPT-large',
            inputs: {
              past_user_inputs: past_user_inputs,
              generated_responses: generated_responses,
              text: message
            }
          });
          generated_responses.push(possible_response.generated_text);
          return possible_response.generated_text;
        }

      };

      return {
        sendMessage,
      }
    }

export default useLanguageModel;
