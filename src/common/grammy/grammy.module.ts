import { DynamicModule, Module, Global } from '@nestjs/common';
import { Bot } from 'grammy';

interface GrammyModuleOptions {
  token: string;
  options?: any;
}

@Global()
@Module({})
export class GrammyModule {
  static forRoot(options: GrammyModuleOptions): DynamicModule {
    const bot = new Bot(options.token);

    const botProvider = {
      provide: 'BOT_INSTANCE',
      useValue: bot,
    };

    return {
      module: GrammyModule,
      providers: [botProvider],
      exports: [botProvider],
    };
  }
}

export function Update() {
  return (target: any) => {
    Reflect.defineMetadata('is:update:handler', true, target);
    return target;
  };
}

export function Hears(text: string | string[]) {
  return (target: any, propertyKey: string, descriptor: PropertyDescriptor) => {
    const original = descriptor.value;
    descriptor.value = function (...args: any[]) {
      const [ctx] = args;
      const texts = Array.isArray(text) ? text : [text];
      if (ctx.message?.text && texts.includes(ctx.message.text)) {
        return original.apply(this, args);
      }
    };
    return descriptor;
  };
}

export function Command(command: string) {
  return (target: any, propertyKey: string, descriptor: PropertyDescriptor) => {
    const original = descriptor.value;
    descriptor.value = function (...args: any[]) {
      const [ctx] = args;
      if (ctx.message?.text?.startsWith(`/${command}`)) {
        return original.apply(this, args);
      }
    };
    return descriptor;
  };
}

export function Action(action: string | RegExp) {
  return (target: any, propertyKey: string, descriptor: PropertyDescriptor) => {
    const original = descriptor.value;
    descriptor.value = function (...args: any[]) {
      const [ctx] = args;
      if (ctx.callbackQuery?.data) {
        const match = typeof action === 'string' 
          ? ctx.callbackQuery.data === action
          : action.test(ctx.callbackQuery.data);
        if (match) {
          if (action instanceof RegExp) {
            ctx.match = ctx.callbackQuery.data.match(action);
          }
          return original.apply(this, args);
        }
      }
    };
    return descriptor;
  };
}

export function On(updateType: string) {
  return (target: any, propertyKey: string, descriptor: PropertyDescriptor) => {
    const original = descriptor.value;
    descriptor.value = function (...args: any[]) {
      const [ctx] = args;
      if (updateType === 'text' && ctx.message?.text) {
        return original.apply(this, args);
      }
      if (updateType === 'photo' && ctx.message?.photo) {
        return original.apply(this, args);
      }
      if (updateType === 'video' && ctx.message?.video) {
        return original.apply(this, args);
      }
    };
    return descriptor;
  };
}

export function Ctx() {
  return (target: any, propertyKey: string, parameterIndex: number) => {
  };
}

export function InjectBot() {
  return (target: any, propertyKey: string | symbol, parameterIndex: number) => {
  };
}
