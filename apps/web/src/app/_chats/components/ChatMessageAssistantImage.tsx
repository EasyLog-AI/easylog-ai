import Image from 'next/image';
import z from 'zod';

import mediaImageSchema from '../schemas/mediaImageSchema';

interface ChatMessageAssistantImageProps {
  data: z.infer<typeof mediaImageSchema>;
}

const ChatMessageAssistantImage = ({
  data
}: ChatMessageAssistantImageProps) => {
  const { url, name, fileName } = data;

  return (
    <div className="max-w-sm overflow-hidden rounded-xl">
      <Image
        src={url}
        alt={name || fileName}
        width={400}
        height={400}
        className="h-auto w-full"
        unoptimized // Since we're using presigned URLs
      />
    </div>
  );
};

export default ChatMessageAssistantImage;
