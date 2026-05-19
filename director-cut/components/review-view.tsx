import React from 'react';
import Image from 'next/image';
import { Play, Reply, ThumbsUp, MoreVertical, Filter, Send, Pin } from 'lucide-react';

export function ReviewView() {
  return (
    <div className="flex flex-col h-full bg-background relative pb-24">
      {/* Video Player Section */}
      <section className="relative w-full aspect-video bg-black group shrink-0">
        <Image 
          src="https://lh3.googleusercontent.com/aida-public/AB6AXuAa-jACri45GGa4lNwguItMKhMrNGDqELVHHQcf85uUPd6lT8_FYAgeHAcmJ17exwXSsuxXyBezTb12nA8FY7Aof5OHXhDJ9L-n97N9nrV8-yemgIYueaRP6L-3xlm5dfAbTPj0qOezqAw5QLAaPWMQzMcxxJhJ4cdZntmLsDPZ6t_jgM9tQs949Kcb_ADSFYcKS_VnEwCnqtTdHx_R8UEoEoPPZFfVUo2SW4q7hlq5oyLXQIa1JTzEbXuvQDDv9dC7CVAu7KNtF4B-" 
          alt="Video Frame"
          fill
          className="object-cover opacity-80"
          unoptimized
        />
        
        {/* Play Button Overlay */}
        <div className="absolute inset-0 flex items-center justify-center pointer-events-none">
           <button className="pointer-events-auto bg-surface/50 border border-outline-variant p-4 rounded-full backdrop-blur-md active:scale-95 transition-transform">
               <Play className="w-8 h-8 text-primary fill-current" />
           </button>
        </div>

        {/* Timeline & Stats Overlay */}
        <div className="absolute bottom-0 w-full p-2 bg-gradient-to-t from-black/90 to-transparent">
          <div className="flex justify-between items-center mb-1">
            <span className="bg-surface-container/80 backdrop-blur-md px-1.5 py-0.5 rounded text-[10px] font-mono text-primary border border-primary/20">00:04:12:15</span>
            <span className="text-[10px] font-mono text-on-surface-variant">24 FPS</span>
          </div>
          <div className="relative h-1 w-full bg-outline-variant/30 rounded-full cursor-pointer">
            <div className="absolute top-0 left-0 h-full w-1/3 bg-primary-container shadow-[0_0_8px_rgba(0,240,255,0.5)]"></div>
            <div className="absolute top-1/2 left-1/3 -translate-y-1/2 w-3 h-3 bg-primary-container rounded-full border border-black shadow-lg"></div>
          </div>
        </div>
      </section>

      {/* Review Feed */}
      <section className="p-4 md:p-6 space-y-4 max-w-3xl mx-auto w-full">
        <div className="flex items-center justify-between mb-2 border-b border-outline-variant pb-2">
          <div className="flex items-center gap-2">
             <div className="w-1 h-5 bg-primary-container rounded-sm"></div>
             <h2 className="text-xl font-bold text-on-surface">Review Feed</h2>
          </div>
          <button className="flex items-center gap-1 text-xs font-semibold text-on-surface-variant hover:text-on-surface transition-colors">
            <Filter className="w-4 h-4" /> Latest
          </button>
        </div>

        <div className="space-y-4">
          <CommentCard 
            author="Alex Rivera"
            time="2 hours ago"
            timestamp="00:04:10:00"
            content="The color grading in the shadows feels a bit too crushed. Can we lift the blacks by 2-3% in this sequence?"
            likes={4}
            avatar="https://lh3.googleusercontent.com/aida-public/AB6AXuD2CLWCEd60nndQkRFspAzqaUAzMP4rUV4rK3dPfJC2-tEMSIa_r2AJiyedYbhMRA0cZJ8izPHte9gWcc0DurQBFDsHYU9K6K4yHHpL7lZ__RJvdyraxusn2z4KsX6JslV1TgpNhW3B2sCgXCd51O3tAESIUFOmqXdjh77r9OKwA2p7qBh_bYxVBcQESHcrEIi5MCdvd6Grk-Y6HiRAE28UZ95QOiN9TFEgoXAwpG2iOypCzxWEVly_WNDGHuyGTNj2titoVG2fZguA"
          />
          <CommentCard 
            author="Sarah Chen"
            time="5 hours ago"
            timestamp="00:04:12:05"
            content="Motion blur on the flying debris seems inconsistent with the main craft speed."
            likes={1}
            avatar="https://lh3.googleusercontent.com/aida-public/AB6AXuA7YT7uXLfVfVc0iRXFa9UAPAl4sQSPMUa0QJ0Jv_DKq54uF0csG81rqU6TEnCZ-77QiXS6Su7FxB-yIl7KLV2oqZCXltqqGUHli2RxTvO0CHE58t61vaLXy85vd30ZHtDKLzjIOurbyDKEBF683Nw6LJ3lb7HfKlrvbu6WPAo90p-juLfpzXX28agk5aDtPfk27hAZhQYakdDNXJv3pO155w4HAyHL6qCqxRCUvivd07jd3SxVXURq617plLPD71WjKVPekTrRCIih"
            attachment="Reference_Grade_v3.jpg"
          />
        </div>
      </section>

      {/* Floating Comment Input Area */}
      <div className="fixed bottom-16 left-0 right-0 p-4 pb-6 bg-surface-container-high/90 backdrop-blur-xl border-t border-outline-variant z-40 max-w-3xl mx-auto w-full md:rounded-t-2xl md:border-x">
        <div className="flex flex-col gap-2">
           <div className="flex items-center justify-between">
              <div className="flex items-center gap-3">
                 <span className="text-xs font-mono text-primary-fixed-dim bg-primary/10 px-2 py-0.5 rounded">00:04:12:15</span>
                 <label className="flex items-center gap-2 cursor-pointer">
                    <input type="checkbox" className="sr-only peer" defaultChecked />
                    <div className="w-8 h-4 bg-outline-variant peer-focus:outline-none rounded-full peer peer-checked:after:translate-x-full peer-checked:after:border-white after:content-[''] after:absolute after:top-[2px] after:left-[2px] after:bg-white after:border-gray-300 after:border after:rounded-full after:h-3 after:w-3 after:transition-all peer-checked:bg-primary-container relative"></div>
                    <span className="text-[10px] uppercase font-bold text-on-surface-variant">Pin Video</span>
                 </label>
              </div>
           </div>
           <div className="flex gap-2 relative">
             <input type="text" placeholder="Add a comment..." className="w-full bg-surface-dim border border-outline-variant rounded-lg px-4 py-2.5 text-sm outline-none focus:border-primary-container transition-colors pr-12 text-on-surface" />
             <button className="absolute right-1 top-1 bottom-1 w-10 bg-primary-container text-on-primary-container rounded flex items-center justify-center hover:opacity-90 active:scale-95 transition-all">
                <Send className="w-4 h-4" />
             </button>
           </div>
        </div>
      </div>
    </div>
  );
}

function CommentCard({ author, time, timestamp, content, likes, avatar, attachment }: any) {
  return (
    <div className="bg-surface-container-low p-4 border border-outline-variant rounded-xl space-y-3">
      <div className="flex items-start justify-between">
        <div className="flex items-center gap-3">
          <div className="w-8 h-8 rounded-full border border-outline-variant overflow-hidden relative bg-surface">
            {avatar ? (
              <Image src={avatar} alt={author} fill className="object-cover" unoptimized/>
            ) : (
              <div className="w-full h-full flex items-center justify-center font-bold text-xs bg-secondary/20 text-secondary">{author.substring(0,2)}</div>
            )}
          </div>
          <div>
            <p className="text-sm font-bold text-on-surface">{author}</p>
            <p className="text-[10px] text-on-surface-variant">{time}</p>
          </div>
        </div>
        <span className="text-[10px] font-mono text-primary bg-primary-container/10 px-2 py-0.5 rounded border border-primary/20">{timestamp}</span>
      </div>

      {attachment && (
        <div className="bg-surface-container p-2 rounded border border-outline-variant flex items-center gap-2">
          <Pin className="w-4 h-4 text-secondary rotate-45" />
          <span className="text-[10px] text-on-surface-variant italic truncate">Attachment: {attachment}</span>
        </div>
      )}

      <p className="text-sm text-on-surface-variant leading-relaxed">{content}</p>
      
      <div className="flex items-center gap-6 pt-1">
        <button className="flex items-center gap-1.5 text-xs text-on-surface-variant hover:text-primary transition-colors">
          <Reply className="w-4 h-4" /> Reply
        </button>
        <button className="flex items-center gap-1.5 text-xs text-on-surface-variant hover:text-secondary transition-colors">
          <ThumbsUp className="w-4 h-4" /> {likes}
        </button>
      </div>
    </div>
  )
}
