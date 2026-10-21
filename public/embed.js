/* link video (YouTube, Facebook, Google Drive, TikTok, Vimeo) -> địa chỉ nhúng xem trên web */
function embedVideo(u) {
  u = String(u || '').trim(); let m;
  if ((m = u.match(/(?:youtube\.com\/(?:watch\?(?:.*&)?v=|embed\/|shorts\/|live\/)|youtu\.be\/)([\w-]{11})/))) return { src: 'https://www.youtube.com/embed/' + m[1] + '?rel=0', kind: 'yt' };
  if (/facebook\.com|fb\.watch/.test(u)) return { src: 'https://www.facebook.com/plugins/video.php?show_text=false&width=1280&href=' + encodeURIComponent(u), kind: 'fb', tall: /\/reel\//.test(u) };
  if ((m = u.match(/drive\.google\.com\/(?:file\/d\/|open\?id=|uc\?(?:.*&)?id=)([\w-]{10,})/)) || (m = u.match(/docs\.google\.com\/file\/d\/([\w-]{10,})/))) return { src: 'https://drive.google.com/file/d/' + m[1] + '/preview', kind: 'gd' };
  if ((m = u.match(/tiktok\.com\/.*video\/(\d+)/))) return { src: 'https://www.tiktok.com/embed/v2/' + m[1], kind: 'tt', tall: true };
  if ((m = u.match(/vimeo\.com\/(?:video\/)?(\d+)/))) return { src: 'https://player.vimeo.com/video/' + m[1], kind: 'vm' };
  return null;
}
