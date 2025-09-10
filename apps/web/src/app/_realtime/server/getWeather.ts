'use server';

export const getWeather = async (city: string) => {
  return `The weather in ${city} is sunny.`;
};
