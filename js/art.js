// art.js — everything drawn on the 320x132 scene, in an Apple II hi-res palette.

const Art = (() => {
  const W = 320;
  const H = 132;
  const GY = 100; // horizon line
  const PAL = { w: '#fff', g: '#14f53c', p: '#ff44fd', o: '#ff6a3c', b: '#14cffd' };

  const ZONES = [
    { name: 'The Ashlands', until: 250, ground: 'g', mtn: 'p', props: ['tree', 'skull', 'tomb', 'tree'] },
    { name: 'The Bone Desert', until: 500, ground: 'o', mtn: 'w', props: ['cactus', 'skull', 'bones', 'cactus'] },
    { name: 'Parasite Marsh', until: 750, ground: 'b', mtn: 'g', props: ['reeds', 'tree', 'skull', 'reeds'] },
    { name: 'The Throne Road', until: Infinity, ground: 'p', mtn: 'o', props: ['ruin', 'pike', 'tomb', 'ruin'] },
  ];

  const S = {
    skull: [
      '.wwwww.',
      'wwwwwww',
      'w.www.w',
      'w.www.w',
      'wwwwwww',
      '.wwwww.',
      '.w.w.w.',
    ],
    tree: [
      '....x......',
      'x...x...x..',
      '.x..x..x...',
      '..x.x.x....',
      '...xxx...x.',
      '....xx..x..',
      '....xxxx...',
      '....xx.....',
      '....xx.....',
      '....xx.....',
      '....xx.....',
      '...xxxx....',
    ],
    cactus: [
      '....xx...',
      '....xx...',
      'x...xx...',
      'x...xx..x',
      'x...xx..x',
      'xxxxxx..x',
      '....xxxxx',
      '....xx...',
      '....xx...',
      '....xx...',
      '....xx...',
      '....xx...',
    ],
    tomb: [
      '..wwwww..',
      '.wwwwwww.',
      'www.w.www',
      'wwwwwwwww',
      'ww.....ww',
      'wwwwwwwww',
      'wwwwwwwww',
      'wwwwwwwww',
    ],
    bones: [
      'w.....w',
      '.w...w.',
      '..www..',
      '.w...w.',
      'w.....w',
    ],
    reeds: [
      '.w....w..',
      '.x..w.x..',
      '.x..x.x.w',
      'x.x.x.x.x',
      'x.x.x.x.x',
      'x.x.x.x.x',
      'x.x.x.x.x',
    ],
    ruin: [
      'x.....x.......',
      'xx....xx...x..',
      'xxxxxxxxx..xx.',
      'x..x..x.xxxxxx',
      'x..x..x.x..x.x',
      'xxxxxxxxx..x.x',
      'x..x..x.xxxxxx',
      'x..x..x.x..x.x',
      'xxxxxxxxxxxxxx',
      'x..x..x.x..x.x',
      'x..x..x.x..x.x',
      'xxxxxxxxxxxxxx',
    ],
    pike: [
      '.wwwww.',
      'wwwwwww',
      'w.www.w',
      'w.www.w',
      'wwwwwww',
      '.wwwww.',
      '...x...',
      '...x...',
      '...x...',
      '...x...',
      '...x...',
      '...x...',
      '...x...',
    ],
    person: [
      '..xxx..',
      '..xxx..',
      '..xxx..',
      '...x...',
      '.xxxxx.',
      'x.xxx.x',
      'x.xxx.x',
      'x.xxx.x',
      '..x.x..',
      '..x.x..',
      '..x.x..',
      '.xx.xx.',
    ],
    oxA: [
      'w..w..............',
      '.ww...............',
      '.xxxx.xxxxxxxxxx..',
      'xxxxxxxxxxxxxxxx.x',
      'x.xxxxxxxxxxxxxxxx',
      'xxxxxxxxxxxxxxxx..',
      '..xxxxxxxxxxxxxx..',
      '...xxxxxxxxxxxxx..',
      '...xx.xx....xx.xx.',
      '...xx.xx....xx.xx.',
      '...ww.ww....ww.ww.',
    ],
    oxB: [
      'w..w..............',
      '.ww...............',
      '.xxxx.xxxxxxxxxx..',
      'xxxxxxxxxxxxxxxx.x',
      'x.xxxxxxxxxxxxxxxx',
      'xxxxxxxxxxxxxxxx..',
      '..xxxxxxxxxxxxxx..',
      '...xxxxxxxxxxxxx..',
      '..xx...xx..xx...xx',
      '.xx.....xxxx.....x',
      '.ww.....wwww.....w',
    ],
  };

  const hash = (n) => {
    const x = Math.sin(n * 127.1 + 11.7) * 43758.5453;
    return x - Math.floor(x);
  };

  const zoneAt = distance => ZONES.find(z => distance < z.until);

  // draw a sprite with its bottom-left corner at (x, base)
  function spr(ctx, rows, x, base, col) {
    const y0 = Math.round(base) - rows.length;
    const x0 = Math.round(x);
    rows.forEach((row, j) => {
      for (let i = 0; i < row.length; i += 1) {
        const ch = row[i];
        if (ch !== '.') {
          ctx.fillStyle = ch === 'x' ? col : PAL[ch];
          ctx.fillRect(x0 + i, y0 + j, 1, 1);
        }
      }
    });
  }

  function sky(ctx, t) {
    ctx.fillStyle = '#000';
    ctx.fillRect(0, 0, W, H);
    ctx.fillStyle = PAL.w;
    for (let i = 0; i < 28; i += 1) {
      if (Math.floor(t / 600 + hash(i) * 9) % 5 !== 0) {
        ctx.fillRect(Math.floor(hash(i + 100) * W), Math.floor(hash(i + 200) * 62), 1, 1);
      }
    }
    // a bloody sun
    ctx.fillStyle = PAL.o;
    for (let dy = -9; dy <= 9; dy += 1) {
      const half = Math.round(Math.sqrt(81 - dy * dy));
      ctx.fillRect(272 - half, 22 + dy, half * 2, 1);
    }
  }

  function mountains(ctx, scroll, col) {
    ctx.fillStyle = col;
    for (let x = 0; x < W; x += 1) {
      const wx = Math.floor(x - scroll * 0.15);
      const h = 20 + 10 * Math.sin(wx * 0.031) + 6 * Math.sin(wx * 0.083 + 1) + 3 * Math.sin(wx * 0.21);
      const top = Math.round(GY - h);
      ctx.fillRect(x, top, 1, 2);
      const phase = ((wx % 3) + 3) % 3;
      for (let y = top + 3; y < GY; y += 1) {
        if ((phase + y) % 3 === 0 && y % 2 === 0) ctx.fillRect(x, y, 1, 1);
      }
    }
  }

  function ground(ctx, scroll, col) {
    ctx.fillStyle = col;
    ctx.fillRect(0, GY, W, 1);
    for (let i = 0; i < 16; i += 1) {
      const x = Math.floor(((hash(i) * 360 + scroll) % 360) - 20);
      const y = GY + 4 + Math.floor(hash(i + 50) * 26);
      ctx.fillRect(x, y, 1, 1);
      ctx.fillRect(x + 1, y + 1, 1, 1);
      ctx.fillRect(x + 2, y, 1, 1);
    }
  }

  function props(ctx, scroll, zone) {
    const col = PAL[zone.ground];
    const first = Math.floor((scroll - W) / 64) - 1;
    const last = Math.floor(scroll / 64) + 1;
    for (let n = first; n <= last; n += 1) {
      if (hash(n + 9) > 0.3) {
        const x = scroll - n * 64 + hash(n) * 20 - 20;
        const type = zone.props[Math.floor(hash(n + 3) * zone.props.length)];
        spr(ctx, S[type], x, GY + 1, col);
      }
    }
  }

  function wheel(ctx, cx, cy, r, angle) {
    ctx.fillStyle = PAL.w;
    for (let dy = -r; dy <= r; dy += 1) {
      for (let dx = -r; dx <= r; dx += 1) {
        if (Math.abs(Math.sqrt(dx * dx + dy * dy) - r) < 0.6) ctx.fillRect(cx + dx, cy + dy, 1, 1);
      }
    }
    for (let k = 0; k < 4; k += 1) {
      const a = angle + k * Math.PI / 2;
      for (let d = 0; d < r; d += 1) {
        ctx.fillRect(Math.round(cx + Math.cos(a) * d), Math.round(cy + Math.sin(a) * d), 1, 1);
      }
    }
  }

  function wagon(ctx, oxen, moving, t, scroll) {
    const wx = 196;
    const gy = 119;
    const bob = moving && Math.floor(t / 260) % 2 ? 1 : 0;
    const top = gy - 15 + bob;

    // trophy pike on the tailgate
    ctx.fillStyle = PAL.o;
    ctx.fillRect(wx + 31, top - 12, 1, 18);
    spr(ctx, S.skull, wx + 28, top - 12, PAL.w);

    // canvas cover
    for (let i = 0; i < 30; i += 1) {
      const h = Math.round(13 * Math.sqrt(1 - ((i - 14.5) / 15.5) ** 2)) + 2;
      ctx.fillStyle = PAL.w;
      ctx.fillRect(wx + i, top - h, 1, h);
      if (i % 7 === 3) {
        ctx.fillStyle = '#000';
        ctx.fillRect(wx + i, top - h + 2, 1, h - 2);
      }
    }
    // wagon box
    ctx.fillStyle = PAL.o;
    ctx.fillRect(wx - 1, top, 32, 7);
    ctx.fillStyle = '#000';
    ctx.fillRect(wx + 1, top + 3, 28, 1);

    const angle = moving ? -scroll / 5 : 0;
    wheel(ctx, wx + 6, gy - 5, 5, angle);
    wheel(ctx, wx + 24, gy - 5, 5, angle + 0.5);

    // tongue and oxen
    const team = Math.max(0, Math.min(oxen, 4));
    if (team) {
      ctx.fillStyle = PAL.w;
      ctx.fillRect(wx - 4 - team * 20, gy - 8, team * 20 + 3, 1);
    }
    for (let i = 0; i < team; i += 1) {
      const frame = moving && Math.floor(t / 220 + i) % 2 ? S.oxB : S.oxA;
      spr(ctx, frame, wx - 23 - i * 20, gy, PAL.o);
    }
  }

  function raiders(ctx, t) {
    for (let i = 0; i < 5; i += 1) {
      const x = 14 + i * 14;
      const base = GY + 12 + (i % 2) * 8;
      const up = Math.floor(t / 300 + i) % 2;
      spr(ctx, S.person, x, base, PAL.p);
      ctx.fillStyle = PAL.w;
      ctx.fillRect(x + 7, base - 14 - up * 2, 1, 9);
      ctx.fillRect(x + 6, base - 14 - up * 2, 3, 1);
    }
  }

  function camp(ctx, t) {
    const base = GY + 14;
    ctx.fillStyle = PAL.w;
    for (let i = 0; i <= 22; i += 1) {
      ctx.fillRect(24 + i, base - i, 1, 1);
      ctx.fillRect(68 - i, base - i, 1, 1);
      if (i % 2 === 0 && i < 12) ctx.fillRect(46, base - i, 1, 1);
    }
    ctx.fillRect(24, base, 45, 1);
    spr(ctx, S.person, 76, base + 2, PAL.b);
    spr(ctx, S.person, 90, base + 6, PAL.b);
    // campfire
    ctx.fillStyle = PAL.o;
    const f = Math.floor(t / 150) % 2;
    ctx.fillRect(106, base + 4 - f, 3, 3 + f);
    ctx.fillRect(107, base + 1 - f, 1, 2);
    ctx.fillStyle = PAL.w;
    ctx.fillRect(104, base + 7, 7, 1);
  }

  function tombstone(ctx) {
    const x0 = 112;
    const w = 96;
    const topY = 26;
    for (let i = 0; i < w; i += 1) {
      const edge = Math.min(i, w - 1 - i);
      const arch = edge < 20 ? Math.round(20 - Math.sqrt(400 - (20 - edge) ** 2)) : 0;
      const y = topY + arch;
      ctx.fillStyle = PAL.w;
      ctx.fillRect(x0 + i, y, 1, i < 2 || i > w - 3 ? GY + 6 - y : 2);
    }
    ctx.fillStyle = PAL.g;
    ctx.fillRect(x0 - 16, GY + 6, w + 32, 1);
    spr(ctx, S.skull, x0 - 14, GY + 6, PAL.w);
    spr(ctx, S.bones, x0 + w + 6, GY + 6, PAL.w);
    spr(ctx, S.tree, 40, GY + 6, PAL.g);
    spr(ctx, S.tree, 262, GY + 6, PAL.g);
  }

  function throne(ctx, t) {
    const base = GY + 24;
    for (let row = 0; row < 5; row += 1) {
      const count = 9 - row * 2;
      for (let i = 0; i < count; i += 1) {
        spr(ctx, S.skull, 160 - count * 4 + i * 8, base - row * 7, PAL.w);
      }
    }
    const y = base - 35;
    const flick = Math.floor(t / 400) % 2;
    spr(ctx, S.person, 157, y, PAL.o);
    ctx.fillStyle = PAL.g;
    ctx.fillRect(159, y - 13, 3, 1);
    ctx.fillRect(159, y - 14 - flick, 1, 1);
    ctx.fillRect(161, y - 14 - flick, 1, 1);
    spr(ctx, S.pike, 96, base, PAL.p);
    spr(ctx, S.pike, 218, base, PAL.p);
    spr(ctx, S.pike, 74, base - 2, PAL.p);
    spr(ctx, S.pike, 240, base - 2, PAL.p);
  }

  function draw(ctx, s) {
    const zone = zoneAt(s.distance);
    sky(ctx, s.t);
    if (s.mode === 'dead') {
      tombstone(ctx);
      return;
    }
    mountains(ctx, s.scroll, PAL[zone.mtn]);
    ground(ctx, s.scroll, PAL[zone.ground]);
    if (s.mode === 'win') {
      throne(ctx, s.t);
      return;
    }
    props(ctx, s.scroll, zone);
    if (s.mode === 'attack') raiders(ctx, s.t);
    if (s.mode === 'shop') camp(ctx, s.t);
    wagon(ctx, s.oxen, s.moving, s.t, s.scroll);
  }

  return { draw, zoneAt };
})();
