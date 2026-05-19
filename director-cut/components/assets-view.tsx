import React, { useState } from 'react';
import Image from 'next/image';
import { Film, Box, Music, Image as ImageIcon, UploadCloud } from 'lucide-react';

export function AssetsView() {
  const [activeFilter, setActiveFilter] = useState('all');
  
  const filters = [
    { id: 'all', label: 'All Assets' },
    { id: 'video', label: 'Video' },
    { id: 'photos', label: 'Photos' },
    { id: '3d', label: '3D Models' },
    { id: 'audio', label: 'Audio' }
  ];

  return (
    <div className="p-4 md:p-6 space-y-6 max-w-5xl mx-auto">
      {/* Category Filter Bar */}
      <div className="flex items-center gap-2 overflow-x-auto pb-2 hide-scrollbar sticky top-0 bg-background/95 backdrop-blur-md z-40 py-2">
        {filters.map(f => (
          <button 
            key={f.id}
            onClick={() => setActiveFilter(f.id)}
            className={`px-4 py-2 rounded-full text-xs font-bold whitespace-nowrap border transition-colors ${
              activeFilter === f.id 
                ? 'bg-primary-container text-on-primary-container border-primary-fixed-dim/30' 
                : 'bg-surface-container text-on-surface-variant border-outline-variant hover:bg-surface-bright hover:text-on-surface'
            }`}
          >
            {f.label}
          </button>
        ))}
      </div>

      {/* Asset Grid */}
      <div className="grid grid-cols-2 md:grid-cols-3 lg:grid-cols-4 gap-4 pb-20">
        
        {/* Video Asset */}
        <AssetCard 
           title="EXT_STREET_NIGHT_01" 
           type="Video" 
           format="ProRes 422" 
           size="1.2 GB" 
           duration="00:42" 
           icon={<Film/>}
           image="https://lh3.googleusercontent.com/aida-public/AB6AXuAzoudO7PBlNZsZ8xps9oChTeKxkoe2ZA5k3pKOar4EDkSyrhCF38Y4HTaJUbbNI9oqGr6ywWG5mlFBdfrSu00-rzlcaToBKKkrkP8ODyLjcSY0u1eujTr0OXHovsTVCJjrSBieiXpO_5TwOHzj2Z_YN5aJrymaVNe5ymjDmC4RX7kfHWsBkr3sbxeIy3Ew907Rd6og0gCf8OT7thedw-P0Ol90IXWXMTn-uYN90HGBwNCbbaD12QIwvm21QfljtIl3B2ZbX3oIZt48"
        />

        {/* 3D Asset */}
        <AssetCard 
           title="HERO_DRONE_MODEL" 
           type="3D" 
           format="42.5K Tris" 
           size="1:1 Scale" 
           icon={<Box/>}
           badge="3D"
           image="https://lh3.googleusercontent.com/aida-public/AB6AXuAfByNCrVrIGfPkht-Ra1DApwiBtTFpWwHb9ajZPhV05Vja1NPR4TK6-aZCfX0YWUReKEu3Ge35yNgxjDyLWLEb7QKoS0XSqgC8yadWENe7-QDVBldhawX9mw-oeWXHgxbS4UiPM3Hv0xH1d1bpzmJr2EtMZvuy8P6jV5bcPCYqpjyXC63sMQui1eE6lRUk0A8ZBl9Vnj5gic4caYuiau-KIW-TbQJbFgJ2PwjDkDCR4ZdpCPXYm5Nzxq67DZXrgtC9uN33_9jcyY0t"
        />

        {/* Photo Asset */}
        <AssetCard 
           title="STILL_LOC_024" 
           type="Photo" 
           format="RAW / 8K" 
           size="42 MB" 
           icon={<ImageIcon/>}
           image="https://lh3.googleusercontent.com/aida-public/AB6AXuBBNcKTNF8TxcnsDKG53HLD2D6AdcC3jw2_suTrsNA1q6PQnrXgznMsh1Qx4ayG-MmhrOFFqJIA6a8a7K7Aq805459t3x_Leuwn2BM4ukIJ3kGoFihPW_6XfjzYLBVVzNZ9j-iMnht9iniWPq3pJfug6PBLR3PUad0-pIYzPvKrqkjOX09s7InFtI1lGwvfqdB0jixNtapnI0Ya-MMIR1m0OkHoZnNikEAIgwVewOw7xV0dsjrckWeL2deM2q0EX_tZmJ1i7vGup3Xu"
        />

        {/* Sequence Asset */}
        <AssetCard 
           title="NOIR_SEQUENCE_09" 
           type="Video" 
           format="H.265" 
           size="450 MB" 
           duration="01:15" 
           icon={<Film/>}
           image="https://lh3.googleusercontent.com/aida-public/AB6AXuCaBgRw3jnYd2Vn2wXTJ5r24LcAPG6bO1wNNUb2qlmFlDeJ555ZCMMiwZFnn2CiARwn03AflanhgcjCkBMyHKMfriRy1RZfQpYjICRiuHXsBh9wZKFfQ3-B3zTkWBD9tu7i8keJUZEqSxVm7ef5L5R9KcK0RhMisahohgoY4cu2SSmRh2_MlOI8WtP0dTyACShxjSqlfbSCt0TCVA91I3SPKvDhFc7jy8ElJULBcYiGQo_OwTnQmwwmAYnfGNG9XMpi8UosEJwEqX_V"
        />

        {/* Upload Placeholder */}
        <div className="aspect-square flex flex-col items-center justify-center border-2 border-dashed border-outline-variant rounded-lg bg-surface-container-low/30 hover:bg-surface hover:border-primary/50 cursor-pointer transition-colors group">
          <UploadCloud className="w-8 h-8 text-outline group-hover:text-primary transition-colors mb-2" />
          <span className="text-[10px] font-bold uppercase tracking-widest text-on-surface-variant group-hover:text-on-surface transition-colors">Tap to Upload</span>
        </div>
      </div>
    </div>
  );
}

function AssetCard({ title, type, format, size, duration, badge, image, icon }: any) {
  return (
    <div className="group relative bg-surface-container-low border border-outline-variant rounded-lg overflow-hidden hover:border-outline cursor-pointer transition-all active:scale-[0.98]">
      <div className="aspect-video relative overflow-hidden bg-surface-dim">
        <Image src={image} fill alt={title} className="object-cover opacity-80 group-hover:opacity-100 transition-opacity" unoptimized/>
        
        {duration && (
          <div className="absolute bottom-1 right-1 bg-black/80 px-1.5 py-0.5 rounded text-[10px] font-bold text-primary-fixed-dim tracking-wider">
            {duration}
          </div>
        )}
        {badge && (
          <div className="absolute top-1 right-1 bg-primary-container/20 border border-primary-container/40 px-1.5 py-0.5 rounded text-[10px] font-bold text-primary-container uppercase tracking-wider">
            {badge}
          </div>
        )}
        <div className="absolute top-1 left-1 bg-black/60 p-1 rounded backdrop-blur-sm">
          {React.cloneElement(icon, { className: 'w-3 h-3 text-primary-fixed-dim' })}
        </div>
      </div>
      <div className="p-3 space-y-1 bg-surface-container-low">
        <h3 className="text-sm font-bold truncate text-on-surface">{title}</h3>
        <div className="flex justify-between items-center opacity-70">
          <span className="text-[10px] uppercase tracking-tighter font-bold">{format}</span>
          <span className="text-[10px]">{size}</span>
        </div>
      </div>
    </div>
  )
}
