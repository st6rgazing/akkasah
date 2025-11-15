"""
EAD (Encoded Archival Description) Parser Service
Parses EAD XML files and extracts collection metadata
"""

import xml.etree.ElementTree as ET
from typing import Dict, List, Optional, Any
from datetime import datetime
import re
import os
import time
from pathlib import Path
from urllib.parse import urljoin
import requests
from bs4 import BeautifulSoup


class EADParser:
    """Parser for EAD XML files"""
    
    def __init__(self):
        self.namespace = {'ead': 'urn:isbn:1-931666-22-9'}
    
    def parse_file(self, file_path: str) -> Dict[str, Any]:
        """Parse a single EAD XML file and extract metadata"""
        try:
            tree = ET.parse(file_path)
            root = tree.getroot()
            
            # Extract basic collection information
            collection_data = self._extract_collection_data(root)
            
            # Extract series and file information
            series_data = self._extract_series_data(root)
            
            # Extract administrative information
            admin_data = self._extract_admin_data(root)
            
            return {
                'collection': collection_data,
                'series': series_data,
                'administrative': admin_data,
                'file_path': file_path,
                'parsed_at': datetime.now().isoformat()
            }
            
        except Exception as e:
            print(f"Error parsing {file_path}: {str(e)}")
            return None
    
    def _extract_collection_data(self, root: ET.Element) -> Dict[str, Any]:
        """Extract collection-level metadata"""
        collection = {}
        
        # Find the archdesc element
        archdesc = root.find('.//ead:archdesc', self.namespace)
        if archdesc is None:
            return collection
        
        # Extract title
        unittitle = archdesc.find('.//ead:unittitle', self.namespace)
        if unittitle is not None:
            collection['title'] = self._clean_text(unittitle.text)
        
        # Extract unit ID
        unitid = archdesc.find('.//ead:unitid', self.namespace)
        if unitid is not None:
            collection['unit_id'] = self._clean_text(unitid.text)
        
        # Extract dates
        unitdate = archdesc.find('.//ead:unitdate', self.namespace)
        if unitdate is not None:
            collection['date_inclusive'] = self._clean_text(unitdate.text)
            collection['date_normal'] = unitdate.get('normal', '')
            collection['date_type'] = unitdate.get('type', '')
        
        # Extract extent (size/quantity)
        extent = archdesc.find('.//ead:extent[@altrender="materialtype spaceoccupied"]', self.namespace)
        if extent is not None:
            collection['extent'] = self._clean_text(extent.text)
        
        # Extract carrier information
        carrier = archdesc.find('.//ead:extent[@altrender="carrier"]', self.namespace)
        if carrier is not None:
            collection['carrier'] = self._clean_text(carrier.text)
        
        # Extract abstract/description
        abstract = archdesc.find('.//ead:abstract', self.namespace)
        if abstract is not None:
            collection['abstract'] = self._clean_text(abstract.text)
        
        # Extract scope and content
        scopecontent = archdesc.find('.//ead:scopecontent', self.namespace)
        if scopecontent is not None:
            collection['scope_content'] = self._clean_text(scopecontent.text)
        
        # Extract biographical/historical information
        bioghist = archdesc.find('.//ead:bioghist', self.namespace)
        if bioghist is not None:
            collection['biographical_historical'] = self._clean_text(bioghist.text)
        
        # Extract languages
        languages = []
        langmaterial = archdesc.find('.//ead:langmaterial', self.namespace)
        if langmaterial is not None:
            for lang in langmaterial.findall('.//ead:language', self.namespace):
                languages.append({
                    'code': lang.get('langcode', ''),
                    'script': lang.get('scriptcode', ''),
                    'text': self._clean_text(lang.text)
                })
        collection['languages'] = languages
        
        # Extract containers
        containers = []
        for container in archdesc.findall('.//ead:container', self.namespace):
            containers.append({
                'type': container.get('type', ''),
                'label': container.get('label', ''),
                'text': self._clean_text(container.text)
            })
        collection['containers'] = containers
        
        # Extract digital objects (images)
        digital_objects = []
        for dao in archdesc.findall('.//ead:dao', self.namespace):
            href = dao.get('{http://www.w3.org/1999/xlink}href', '')
            role = dao.get('{http://www.w3.org/1999/xlink}role', '').lower()
            title = dao.get('{http://www.w3.org/1999/xlink}title', '')
            description = self._clean_text(dao.find('.//ead:daodesc', self.namespace).text) if dao.find('.//ead:daodesc', self.namespace) is not None else ''
            
            digital_obj = {
                'href': href,
                'title': title,
                'role': dao.get('{http://www.w3.org/1999/xlink}role', ''),
                'description': description
            }
            
            # Process image-service URLs to extract actual image IDs
            if role == 'image-service' and href:
                image_data = self._process_image_service_url(href, title or collection.get('title', ''))
                digital_obj.update({
                    'image_id': image_data.get('image_id'),
                    'full_image': image_data.get('full_image'),
                    'thumbnail': image_data.get('thumbnail'),
                    'back_image_id': image_data.get('back_image_id')
                })
            
            digital_objects.append(digital_obj)
        collection['digital_objects'] = digital_objects
        
        return collection
    
    def _extract_series_data(self, root: ET.Element) -> List[Dict[str, Any]]:
        """Extract series and file-level data"""
        series_list = []
        
        # Find all series (c elements with level="series")
        series_elements = root.findall('.//ead:c[@level="series"]', self.namespace)
        
        for series in series_elements:
            series_data = {
                'level': 'series',
                'title': '',
                'unit_id': '',
                'date_inclusive': '',
                'files': []
            }
            
            # Extract series title
            unittitle = series.find('.//ead:unittitle', self.namespace)
            if unittitle is not None:
                series_data['title'] = self._clean_text(unittitle.text)
            
            # Extract series unit ID
            unitid = series.find('.//ead:unitid', self.namespace)
            if unitid is not None:
                series_data['unit_id'] = self._clean_text(unitid.text)
            
            # Extract series date
            unitdate = series.find('.//ead:unitdate', self.namespace)
            if unitdate is not None:
                series_data['date_inclusive'] = self._clean_text(unitdate.text)
            
            # Extract files within this series
            file_elements = series.findall('.//ead:c[@level="file"]', self.namespace)
            for file_elem in file_elements:
                file_data = self._extract_file_data(file_elem)
                if file_data:
                    series_data['files'].append(file_data)
            
            series_list.append(series_data)
        
        return series_list
    
    def _extract_file_data(self, file_elem: ET.Element) -> Dict[str, Any]:
        """Extract individual file data"""
        file_data = {
            'level': 'file',
            'title': '',
            'unit_id': '',
            'date_creation': '',
            'extent': '',
            'dimensions': '',
            'languages': [],
            'containers': [],
            'digital_objects': []
        }
        
        # Extract file title
        unittitle = file_elem.find('.//ead:unittitle', self.namespace)
        if unittitle is not None:
            file_data['title'] = self._clean_text(unittitle.text)
        
        # Extract file unit ID
        unitid = file_elem.find('.//ead:unitid', self.namespace)
        if unitid is not None:
            file_data['unit_id'] = self._clean_text(unitid.text)
        
        # Extract creation date
        unitdate = file_elem.find('.//ead:unitdate', self.namespace)
        if unitdate is not None:
            file_data['date_creation'] = self._clean_text(unitdate.text)
        
        # Extract extent
        extent = file_elem.find('.//ead:extent[@altrender="materialtype spaceoccupied"]', self.namespace)
        if extent is not None:
            file_data['extent'] = self._clean_text(extent.text)
        
        # Extract dimensions
        dimensions = file_elem.find('.//ead:dimensions', self.namespace)
        if dimensions is not None:
            file_data['dimensions'] = self._clean_text(dimensions.text)
        
        # Extract languages
        langmaterial = file_elem.find('.//ead:langmaterial', self.namespace)
        if langmaterial is not None:
            for lang in langmaterial.findall('.//ead:language', self.namespace):
                file_data['languages'].append({
                    'code': lang.get('langcode', ''),
                    'script': lang.get('scriptcode', ''),
                    'text': self._clean_text(lang.text)
                })
        
        # Extract containers
        for container in file_elem.findall('.//ead:container', self.namespace):
            file_data['containers'].append({
                'type': container.get('type', ''),
                'label': container.get('label', ''),
                'text': self._clean_text(container.text)
            })
        
        # Extract digital objects for files
        for dao in file_elem.findall('.//ead:dao', self.namespace):
            href = dao.get('{http://www.w3.org/1999/xlink}href', '')
            role = dao.get('{http://www.w3.org/1999/xlink}role', '').lower()
            title = dao.get('{http://www.w3.org/1999/xlink}title', '')
            description = self._clean_text(dao.find('.//ead:daodesc', self.namespace).text) if dao.find('.//ead:daodesc', self.namespace) is not None else ''
            
            digital_obj = {
                'href': href,
                'title': title,
                'role': dao.get('{http://www.w3.org/1999/xlink}role', ''),
                'description': description
            }
            
            # Process image-service URLs to extract actual image IDs
            if role == 'image-service' and href:
                item_title = title or file_data.get('title', '')
                image_data = self._process_image_service_url(href, item_title)
                digital_obj.update({
                    'image_id': image_data.get('image_id'),
                    'full_image': image_data.get('full_image'),
                    'thumbnail': image_data.get('thumbnail'),
                    'back_image_id': image_data.get('back_image_id')
                })
            
            file_data['digital_objects'].append(digital_obj)
        
        return file_data
    
    def _extract_admin_data(self, root: ET.Element) -> Dict[str, Any]:
        """Extract administrative metadata"""
        admin_data = {}
        
        # Extract repository information
        repository = root.find('.//ead:repository/ead:corpname', self.namespace)
        if repository is not None:
            admin_data['repository'] = self._clean_text(repository.text)
        
        # Extract finding aid status
        findaidstatus = root.find('.//ead:eadheader', self.namespace)
        if findaidstatus is not None:
            admin_data['finding_aid_status'] = findaidstatus.get('findaidstatus', '')
        
        # Extract creation date
        creation = root.find('.//ead:creation', self.namespace)
        if creation is not None:
            admin_data['creation_date'] = self._clean_text(creation.text)
        
        # Extract language usage
        langusage = root.find('.//ead:langusage', self.namespace)
        if langusage is not None:
            admin_data['language_usage'] = self._clean_text(langusage.text)
        
        return admin_data
    
    def _clean_text(self, text: str) -> str:
        """Clean and normalize text content"""
        if text is None:
            return ""
        
        # Remove extra whitespace and normalize
        text = re.sub(r'\s+', ' ', text.strip())
        return text
    
    def _process_image_service_url(self, url: str, item_title: str = "") -> Dict[str, Any]:
        """
        Process an image-service URL to extract the actual image ID.
        This implements the PHP logic from the original WordPress implementation.
        
        Args:
            url: The URL from the EAD XML file
            item_title: Title of the item (for logging purposes)
            
        Returns:
            Dictionary with image_id, full_image, thumbnail, and optionally back_image_id
        """
        result = {
            'image_id': None,
            'full_image': url,
            'thumbnail': url,
            'back_image_id': None
        }
        
        if not url:
            return result
        
        url_lower = url.lower()
        
        # Case 1: URL ends with .jp2
        if url_lower.endswith('.jp2'):
            # Extract image_id from last 2 path segments
            url_parts = url.split('/')
            if len(url_parts) >= 2:
                result['image_id'] = '/'.join(url_parts[-2:])
            else:
                result['image_id'] = url
            result['full_image'] = url
            result['thumbnail'] = url
            return result
        
        # Case 2: URL ends with .jpg
        if url_lower.endswith('.jpg') or url_lower.endswith('.jpeg'):
            result['image_id'] = url
            result['full_image'] = url
            # Create thumbnail URL by replacing .jpg with -150x150.jpg
            if url_lower.endswith('.jpg'):
                result['thumbnail'] = url.replace('.jpg', '-150x150.jpg').replace('.JPG', '-150x150.jpg')
            else:
                result['thumbnail'] = url.replace('.jpeg', '-150x150.jpg').replace('.JPEG', '-150x150.jpg')
            return result
        
        # Case 3: Need to fetch HTML and extract from div.dlts_image_map
        retry = 0
        max_retries = 5
        
        while retry < max_retries:
            try:
                response = requests.get(url, timeout=10, allow_redirects=True)
                if response.status_code == 200:
                    html = response.text
                    soup = BeautifulSoup(html, 'html.parser')
                    
                    # Find div.dlts_image_map element
                    image_map_div = soup.find('div', class_='dlts_image_map')
                    if not image_map_div:
                        # Try alternative: find by id or data attribute
                        image_map_div = soup.find('div', {'class': re.compile(r'dlts_image_map', re.I)})
                    
                    if image_map_div:
                        # Try to get IIIF manifest URL first (best quality)
                        data_manifest = image_map_div.get('data-manifest')
                        iiif_service_url = None
                        
                        if data_manifest:
                            try:
                                # Fetch the IIIF manifest to get the actual service URL
                                manifest_response = requests.get(data_manifest, timeout=10)
                                if manifest_response.status_code == 200:
                                    manifest_data = manifest_response.json()
                                    # Extract the @id which is the IIIF service base URL
                                    iiif_service_url = manifest_data.get('@id')
                                    if iiif_service_url:
                                        # Construct IIIF URLs from the service URL
                                        result['full_image'] = f"{iiif_service_url}/full/full/0/default.jpg"
                                        result['thumbnail'] = f"{iiif_service_url}/full/!300,300/0/default.jpg"
                                        
                                        # Extract image_id from the service URL
                                        service_parts = iiif_service_url.split('/')
                                        if len(service_parts) >= 2:
                                            # Get last two meaningful segments
                                            # Format is usually: /iiif/2/photo%2FAD_MC_028_ref1360%2FAD_MC_028_ref1360_n000001_d.jp2
                                            # Extract the path part after /iiif/2/
                                            path_part = '/'.join(service_parts[4:]) if len(service_parts) > 4 else '/'.join(service_parts[-2:])
                                            result['image_id'] = path_part
                            except Exception as e:
                                print(f"Error fetching IIIF manifest {data_manifest}: {str(e)}")
                        
                        # Fallback to data-uri if manifest didn't work
                        if not iiif_service_url:
                            data_uri = image_map_div.get('data-uri')
                            if data_uri:
                                img_url_parts = data_uri.split('/')
                                if len(img_url_parts) >= 2:
                                    result['image_id'] = '/'.join(img_url_parts[-2:])
                                    
                                    # Use data-uri directly as full_image
                                    result['full_image'] = data_uri
                                    
                                    # For thumbnails, if it's a JP2 file, try to construct IIIF thumbnail URL
                                    if data_uri.lower().endswith('.jp2'):
                                        iiif_base = data_uri.rsplit('.jp2', 1)[0]
                                        result['thumbnail'] = f"{iiif_base}/full/!300,300/0/default.jpg"
                                    elif data_uri.lower().endswith('.jpg') or data_uri.lower().endswith('.jpeg'):
                                        result['thumbnail'] = data_uri.replace('.jpg', '-150x150.jpg').replace('.JPG', '-150x150.jpg').replace('.jpeg', '-150x150.jpg').replace('.JPEG', '-150x150.jpg')
                                    else:
                                        # Try to construct IIIF URLs
                                        iiif_base = data_uri.rstrip('/')
                                        result['thumbnail'] = f"{iiif_base}/full/!300,300/0/default.jpg"
                                        result['full_image'] = f"{iiif_base}/full/full/0/default.jpg"
                                else:
                                    result['image_id'] = data_uri
                                    result['full_image'] = data_uri
                                    result['thumbnail'] = data_uri
                        
                        # Check for reverse/back image
                        # First try a.next-page
                        next_page_link = soup.find('a', class_='next-page')
                        back_url = None
                        is_site = False
                        
                        if not next_page_link:
                            # Try a.next
                            next_link = soup.find('a', class_='next')
                            if next_link:
                                class_names = next_link.get('class', [])
                                if 'active' in class_names:
                                    next_page_link = next_link
                                    is_site = True
                        
                        if next_page_link and next_page_link.get('href'):
                            back_url = next_page_link.get('href')
                            
                            # Fetch the back page HTML
                            if is_site:
                                back_full_url = back_url
                            else:
                                # Prepend http://dlib.nyu.edu if it's a relative URL
                                if back_url.startswith('http'):
                                    back_full_url = back_url
                                else:
                                    back_full_url = urljoin('http://dlib.nyu.edu', back_url)
                            
                            try:
                                back_response = requests.get(back_full_url, timeout=10, allow_redirects=True)
                                if back_response.status_code == 200:
                                    back_html = back_response.text
                                    back_soup = BeautifulSoup(back_html, 'html.parser')
                                    back_image_map = back_soup.find('div', class_='dlts_image_map')
                                    
                                    if not back_image_map:
                                        back_image_map = back_soup.find('div', {'class': re.compile(r'dlts_image_map', re.I)})
                                    
                                    if back_image_map:
                                        # Try IIIF manifest first
                                        back_data_manifest = back_image_map.get('data-manifest')
                                        back_iiif_service_url = None
                                        
                                        if back_data_manifest:
                                            try:
                                                back_manifest_response = requests.get(back_data_manifest, timeout=10)
                                                if back_manifest_response.status_code == 200:
                                                    back_manifest_data = back_manifest_response.json()
                                                    back_iiif_service_url = back_manifest_data.get('@id')
                                                    if back_iiif_service_url:
                                                        result['back_full_image'] = f"{back_iiif_service_url}/full/full/0/default.jpg"
                                                        result['back_thumbnail'] = f"{back_iiif_service_url}/full/!300,300/0/default.jpg"
                                                        
                                                        back_service_parts = back_iiif_service_url.split('/')
                                                        if len(back_service_parts) >= 2:
                                                            back_path_part = '/'.join(back_service_parts[4:]) if len(back_service_parts) > 4 else '/'.join(back_service_parts[-2:])
                                                            result['back_image_id'] = back_path_part
                                            except Exception as e:
                                                print(f"Error fetching back IIIF manifest: {str(e)}")
                                        
                                        # Fallback to data-uri
                                        if not back_iiif_service_url:
                                            back_data_uri = back_image_map.get('data-uri')
                                            if back_data_uri:
                                                back_img_url_parts = back_data_uri.split('/')
                                                if len(back_img_url_parts) >= 2:
                                                    result['back_image_id'] = '/'.join(back_img_url_parts[-2:])
                                                    result['back_full_image'] = back_data_uri
                                                    
                                                    if back_data_uri.lower().endswith('.jp2'):
                                                        back_iiif_base = back_data_uri.rsplit('.jp2', 1)[0]
                                                        result['back_thumbnail'] = f"{back_iiif_base}/full/!300,300/0/default.jpg"
                                                    elif back_data_uri.lower().endswith('.jpg') or back_data_uri.lower().endswith('.jpeg'):
                                                        result['back_thumbnail'] = back_data_uri.replace('.jpg', '-150x150.jpg').replace('.JPG', '-150x150.jpg').replace('.jpeg', '-150x150.jpg').replace('.JPEG', '-150x150.jpg')
                                                    else:
                                                        back_iiif_base = back_data_uri.rstrip('/')
                                                        result['back_thumbnail'] = f"{back_iiif_base}/full/!300,300/0/default.jpg"
                                                        result['back_full_image'] = f"{back_iiif_base}/full/full/0/default.jpg"
                                                else:
                                                    result['back_image_id'] = back_data_uri
                                                    result['back_full_image'] = back_data_uri
                                                    result['back_thumbnail'] = back_data_uri
                            except Exception as e:
                                print(f"Error fetching back image for {item_title}: {str(e)}")
                        
                        return result
                    else:
                        # Could not find the image map div
                        print(f"Warning: Could not find div.dlts_image_map in {url}")
                        return result
                        
            except Exception as e:
                retry += 1
                if retry < max_retries:
                    print(f"Retry {retry} for {item_title}: {str(e)}")
                    time.sleep(2)
                else:
                    print(f"Error processing image URL {url} after {max_retries} retries: {str(e)}")
                    return result
        
        return result
    
    def parse_directory(self, directory_path: str) -> List[Dict[str, Any]]:
        """Parse all EAD XML files in a directory"""
        parsed_files = []
        directory = Path(directory_path)
        
        if not directory.exists():
            print(f"Directory {directory_path} does not exist")
            return parsed_files
        
        xml_files = list(directory.glob("*.xml"))
        print(f"Found {len(xml_files)} XML files to parse")
        
        for xml_file in xml_files:
            print(f"Parsing {xml_file.name}...")
            parsed_data = self.parse_file(str(xml_file))
            if parsed_data:
                parsed_files.append(parsed_data)
        
        return parsed_files


def main():
    """Test the EAD parser"""
    parser = EADParser()
    
    # Test with a single file
    test_file = "/Users/mariam/akkasah/ArchiveFiles/AD.MC.002_20250929_091254_UTC__ead.xml"
    if os.path.exists(test_file):
        result = parser.parse_file(test_file)
        if result:
            print("Collection Title:", result['collection'].get('title', 'N/A'))
            print("Unit ID:", result['collection'].get('unit_id', 'N/A'))
            print("Date Range:", result['collection'].get('date_inclusive', 'N/A'))
            print("Extent:", result['collection'].get('extent', 'N/A'))
            print("Abstract:", result['collection'].get('abstract', 'N/A')[:200] + "...")
            print("Number of Series:", len(result['series']))
            print("Total Files:", sum(len(s['files']) for s in result['series']))


if __name__ == "__main__":
    main()
