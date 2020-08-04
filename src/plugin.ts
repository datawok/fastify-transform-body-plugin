import { FastifyInstance, RegisterOptions } from 'fastify';
import * as http from 'http';
import * as http2 from 'http2';
import * as https from 'https';

import { CaseFormat, mapper } from './mapper';

export type HttpServer = http.Server | https.Server | http2.Http2Server | http2.Http2SecureServer;
export type HttpRequest = http.IncomingMessage | http2.Http2ServerRequest;
export type HttpResponse = http.ServerResponse | http2.Http2ServerResponse;

export interface TransformBodyOptions {
  internalCaseFormat: CaseFormat;
  validateRequestBody: boolean;
  caseFormatResolver(request: any): any;
}

export interface FastifyTransformBodyOptions<
  HttpServer = http.Server,
  HttpRequest = http.IncomingMessage,
  HttpResponse = http.ServerResponse
> extends RegisterOptions<HttpServer, HttpRequest, HttpResponse> {
  transformBody: TransformBodyOptions;
}

export async function fastifyTransformBody<
  HttpServer = http.Server,
  HttpRequest = http.IncomingMessage,
  HttpResponse = http.ServerResponse
>(
  fastify: FastifyInstance<HttpServer, HttpRequest, HttpResponse>,
  options: FastifyTransformBodyOptions<HttpServer, HttpRequest, HttpResponse>
): Promise<void> {
  const { internalCaseFormat, validateRequestBody, caseFormatResolver } = options.transformBody;
  async function preHandler(request, reply) {
    if (!request.body) {
      return;
    }
    if (
      !request.headers ||
      !request.headers['content-type'] ||
      request.headers['content-type'] !== 'application/json'
    ) {
      return;
    }
    const requestBodyCaseFormat = await caseFormatResolver(request);
    const internalBodyCaseFormat = requestBodyCaseFormat !== internalCaseFormat ? internalCaseFormat : null;
    if (!requestBodyCaseFormat) {
      return;
    }
    const result = mapper(request.body, {
      fromCase: requestBodyCaseFormat,
      toCase: internalBodyCaseFormat,
    });
    if (validateRequestBody) {
      if (result.errors.length) {
        console.log(`Invalid ${requestBodyCaseFormat}: `, result.errors);
      }
    }
    request.body = result.value;
  }
  async function preSerialization(request, reply, payload) {
    if (!payload || payload === {}) {
      return;
    }
    if (
      !request.headers ||
      !request.headers['content-type'] ||
      request.headers['content-type'] !== 'application/json'
    ) {
      return;
    }
    const internalBodyCaseFormat = internalCaseFormat;
    const responseBodyCaseFormat = await caseFormatResolver(request);
    if (!responseBodyCaseFormat) {
      return;
    }
    const result = mapper(payload, {
      fromCase: internalBodyCaseFormat,
      toCase: responseBodyCaseFormat,
    });
    return result.value;
  }
  fastify.addHook('preHandler', preHandler);
  fastify.addHook('preSerialization', preSerialization);
}
